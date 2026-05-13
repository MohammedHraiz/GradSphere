package com.gradproject.platform.modules.admin.importer;

import com.gradproject.platform.exception.BadRequestException;
import com.gradproject.platform.modules.user.UserDepartment;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class StudentPdfImportParser {

    private static final Logger log = LoggerFactory.getLogger(StudentPdfImportParser.class);

    private static final Pattern UNIVERSITY_ID_PATTERN = Pattern.compile("\\b32\\d{8,9}\\b");
    private static final Pattern ARABIC_PATTERN = Pattern.compile("[\\u0600-\\u06FF]");
    private static final Pattern NON_ARABIC_PATTERN = Pattern.compile("[^\\u0600-\\u06FF\\s]");
    private static final Pattern ONLY_NUMBERS_PATTERN = Pattern.compile("^\\d+(\\s+\\d+)*$");

    private static final String UNIVERSITY_ID_HEADER = "الرقم الجامعي";
    private static final String STUDENT_NAME_HEADER = "اسم الطالب";

    private static final List<String> IGNORE_PHRASES = List.of(
            "نسخة غير معتمدة",
            "لم يتقدم",
            "تسلسل"
    );

    private static final List<String> HEADER_KEYWORDS = List.of(
            "جامعة",
            "كلية",
            "القسم",
            "المادة",
            "الشعبة",
            "العلامة",
            "المعدل",
            "السنة",
            "الفصل",
            "الرقم",
            "الاسم",
            "للطلبة",
            "طلبة",
            "المشروع",
            "المجموع",
            "المشاركة"
    );

    public ParsedStudentBatch parse(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("PDF file is required.");
        }

        if (!isPdfFile(file)) {
            throw new BadRequestException("Only PDF files are supported.");
        }

        try {
            return parsePdf(file.getBytes());
        } catch (IOException exception) {
            throw new BadRequestException("Unable to read PDF file.");
        }
    }

    ParsedStudentBatch parseText(String text) {
        String normalized = normalizeText(text);
        UserDepartment department = detectDepartment(normalized);
        List<ParsedStudentRow> rows = extractRowsFromPage(normalized, 1, 1);
        return new ParsedStudentBatch(department, rows);
    }

    private ParsedStudentBatch parsePdf(byte[] pdfBytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(false);

            StringBuilder fullText = new StringBuilder();
            List<ParsedStudentRow> rows = new ArrayList<>();
            int nextRowNumber = 1;

            for (int page = 1; page <= document.getNumberOfPages(); page += 1) {
                stripper.setStartPage(page);
                stripper.setEndPage(page);

                String pageText = normalizeText(stripper.getText(document));
                fullText.append(pageText).append('\n');

                List<ParsedStudentRow> pageRows = extractRowsFromPage(pageText, page, nextRowNumber);
                rows.addAll(pageRows);
                nextRowNumber += pageRows.size();
            }

            return new ParsedStudentBatch(detectDepartment(fullText.toString()), rows);
        }
    }

    private boolean isPdfFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null && contentType.toLowerCase(Locale.ROOT).contains("pdf")) {
            return true;
        }
        String name = file.getOriginalFilename();
        return name != null && name.toLowerCase(Locale.ROOT).endsWith(".pdf");
    }

    private List<ParsedStudentRow> extractRowsFromPage(String text, int pageNumber, int firstRowNumber) {
        List<String> ids = extractUniversityIds(text);
        List<String> names = extractNamesFromHeaderBlock(text);

        if (names.isEmpty()) {
            List<ParsedStudentRow> fallbackRows = extractRowsFromInlineText(text, firstRowNumber);
            logPageSummary(pageNumber, ids, fallbackRows.stream().map(ParsedStudentRow::name).toList(), fallbackRows);
            return fallbackRows;
        }

        List<ParsedStudentRow> rows = new ArrayList<>();
        for (int index = 0; index < ids.size(); index += 1) {
            String name = index < names.size() ? names.get(index) : null;
            rows.add(new ParsedStudentRow(firstRowNumber + index, name, ids.get(index)));
        }

        logPageSummary(pageNumber, ids, names, rows);
        return rows;
    }

    private List<String> extractUniversityIds(String text) {
        List<String> ids = new ArrayList<>();
        Matcher matcher = UNIVERSITY_ID_PATTERN.matcher(text);
        while (matcher.find()) {
            ids.add(matcher.group());
        }
        return ids;
    }

    private List<String> extractNamesFromHeaderBlock(String text) {
        List<String> names = new ArrayList<>();
        if (!hasText(text)) {
            return names;
        }

        boolean inNameBlock = false;
        for (String rawLine : text.split("\\R")) {
            String line = normalizeWhitespace(rawLine);
            if (!hasText(line)) {
                continue;
            }

            if (!inNameBlock) {
                if (line.contains(UNIVERSITY_ID_HEADER)) {
                    inNameBlock = true;
                }
                continue;
            }

            if (line.contains(STUDENT_NAME_HEADER)) {
                break;
            }

            String name = extractArabicName(line);
            if (isNameCandidate(line, name)) {
                names.add(name);
            }
        }

        return names;
    }

    private List<ParsedStudentRow> extractRowsFromInlineText(String text, int firstRowNumber) {
        List<ParsedStudentRow> rows = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return rows;
        }

        String pendingName = null;
        int rowNumber = firstRowNumber;

        for (String rawLine : text.split("\\R")) {
            String line = normalizeWhitespace(rawLine);
            if (isIgnorableLine(line)) {
                continue;
            }

            Matcher matcher = UNIVERSITY_ID_PATTERN.matcher(line);
            List<String> ids = new ArrayList<>();
            while (matcher.find()) {
                ids.add(matcher.group());
            }

            if (ids.isEmpty()) {
                String nameCandidate = extractArabicName(line);
                if (isNameCandidate(line, nameCandidate)) {
                    pendingName = nameCandidate;
                }
                continue;
            }

            for (String id : ids) {
                String nameFromLine = extractArabicName(line.replace(id, " "));
                String resolvedName = hasText(nameFromLine) ? nameFromLine : pendingName;
                rows.add(new ParsedStudentRow(rowNumber, resolvedName, id));
                rowNumber += 1;
                pendingName = null;
            }
        }

        return rows;
    }

    private void logPageSummary(int pageNumber, List<String> ids, List<String> names, List<ParsedStudentRow> rows) {
        log.debug("Student PDF import page {}: extracted {} university IDs and {} names.", pageNumber, ids.size(), names.size());
        rows.stream()
                .limit(3)
                .forEach(row -> log.debug(
                        "Student PDF import page {} sample row {}: {} / {}",
                        pageNumber,
                        row.rowNumber(),
                        row.universityId(),
                        row.name()
                ));
    }

    private boolean isIgnorableLine(String line) {
        if (!hasText(line)) {
            return true;
        }

        for (String phrase : IGNORE_PHRASES) {
            if (line.contains(phrase)) {
                return true;
            }
        }

        return ONLY_NUMBERS_PATTERN.matcher(line).matches() && !UNIVERSITY_ID_PATTERN.matcher(line).find();
    }

    private boolean isNameCandidate(String line, String nameCandidate) {
        if (!hasText(nameCandidate)) {
            return false;
        }

        if (UNIVERSITY_ID_PATTERN.matcher(line).find()) {
            return false;
        }

        if (!hasArabic(line)) {
            return false;
        }

        if (containsHeaderKeyword(line)) {
            return false;
        }

        return nameCandidate.split("\\s+").length >= 2;
    }

    private boolean containsHeaderKeyword(String line) {
        for (String keyword : HEADER_KEYWORDS) {
            if (line.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String extractArabicName(String line) {
        if (!hasText(line)) {
            return null;
        }

        String sanitized = NON_ARABIC_PATTERN.matcher(line).replaceAll(" ");
        String normalized = normalizeWhitespace(sanitized);
        return hasText(normalized) ? normalized : null;
    }

    private boolean hasArabic(String text) {
        return hasText(text) && ARABIC_PATTERN.matcher(text).find();
    }

    private String normalizeText(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\u0000", " ");
    }

    private String normalizeWhitespace(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().replaceAll("\\s{2,}", " ");
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private UserDepartment detectDepartment(String text) {
        if (!hasText(text)) {
            return null;
        }

        String normalized = text.toLowerCase(Locale.ROOT);
        if (normalized.contains("نظم المعلومات الحاسوبية")) {
            return UserDepartment.COMPUTER_INFORMATION_SCIENCE;
        }
        if (normalized.contains("علم الحاسوب")) {
            return UserDepartment.COMPUTER_SCIENCE;
        }
        if (normalized.contains("هندسة البرمجيات")) {
            return UserDepartment.SOFTWARE_ENGINEERING;
        }
        if (normalized.contains("الرسوم المتحركة") || normalized.contains("الأنيميشن")) {
            return UserDepartment.ANIMATION;
        }

        return null;
    }

    public record ParsedStudentRow(int rowNumber, String name, String universityId) {
    }

    public record ParsedStudentBatch(UserDepartment department, List<ParsedStudentRow> rows) {
    }
}
