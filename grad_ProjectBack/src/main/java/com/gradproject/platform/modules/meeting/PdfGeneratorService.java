package com.gradproject.platform.modules.meeting;

import com.gradproject.platform.exception.MeetingNotFoundException;
import com.gradproject.platform.modules.project.Project;
import com.gradproject.platform.modules.team.Team;
import com.gradproject.platform.modules.user.User;
import com.gradproject.platform.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

import java.io.ByteArrayOutputStream;
import java.awt.Color;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfGeneratorService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final String UNIVERSITY_HEADER = "Al-Balqa Applied University - Prince Abdullah bin Ghazi Faculty of Information Technology.";

    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;

    public Resource generateMeetingForm(UUID meetingId, Authentication authentication) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new MeetingNotFoundException(meetingId));

        User currentUser = resolveCurrentUser(authentication);
        if (!canAccessMeeting(meeting, currentUser)) {
            throw new org.springframework.security.access.AccessDeniedException("You are not allowed to download this meeting form");
        }

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 54, 54);
            PdfWriter writer = PdfWriter.getInstance(document, outputStream);
            document.open();

            drawBorder(writer, document);
            addHeader(document);
            addMeetingInfo(document, meeting);
            addSummarySection(document, meeting);
            addSignatureSection(document);

            document.close();
            return new ByteArrayResource(outputStream.toByteArray());
        } catch (Exception ex) {
            log.error("Failed to generate meeting PDF for meeting {}", meetingId, ex);
            throw new RuntimeException("Could not generate PDF form");
        }
    }

    private boolean canAccessMeeting(Meeting meeting, User currentUser) {
        if (currentUser.getAuthorities().stream().map(GrantedAuthority::getAuthority).anyMatch(authority -> "ROLE_DEAN_OFFICE".equals(authority) || "ROLE_ADMIN".equals(authority))) {
            return true;
        }

        Team team = meeting.getProject() != null ? meeting.getProject().getTeam() : null;
        return team != null && team.getSupervisor() != null && currentUser.getId() != null && currentUser.getId().equals(team.getSupervisor().getId());
    }

    private User resolveCurrentUser(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }
        if (principal instanceof UserDetails userDetails) {
            return userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Authenticated user not found"));
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Authenticated user not found"));
    }

    private void addHeader(Document document) throws Exception {
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, Color.BLACK);
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.BLACK);

        Paragraph university = new Paragraph(UNIVERSITY_HEADER, headerFont);
        university.setAlignment(Element.ALIGN_CENTER);
        university.setSpacingAfter(8f);
        document.add(university);

        Paragraph title = new Paragraph("Project Meeting Attendance & Progress Form", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(12f);
        document.add(title);
    }

    private void addMeetingInfo(Document document, Meeting meeting) throws Exception {
        Project project = meeting.getProject();
        Team team = project.getTeam();

        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100f);
        table.setSpacingBefore(8f);
        table.setSpacingAfter(10f);

        addCell(table, "Project Group ID", team != null && team.getId() != null ? team.getId().toString() : "N/A");
        addCell(table, "Meeting Date", meeting.getMeetingDate() != null ? meeting.getMeetingDate().format(DATE_TIME_FORMATTER) : "N/A");
        addCell(table, "Summary", safeText(meeting.getSummary()));
        addCell(table, "Tasks", safeText(meeting.getTasks()));
        addCell(table, "Progress Rating", meeting.getProgressRating() != null ? meeting.getProgressRating().toString() : "N/A");
        addCell(table, "Project Title", safeText(project.getTitle()));

        document.add(table);
    }

    private void addSummarySection(Document document, Meeting meeting) throws Exception {
        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK);
        Paragraph sectionTitle = new Paragraph("Meeting Notes", sectionFont);
        sectionTitle.setSpacingBefore(6f);
        sectionTitle.setSpacingAfter(6f);
        document.add(sectionTitle);

        Paragraph summary = new Paragraph(safeText(meeting.getSummary()));
        summary.setLeading(18f);
        document.add(summary);

        Paragraph tasks = new Paragraph("\nTasks: " + safeText(meeting.getTasks()));
        tasks.setLeading(18f);
        document.add(tasks);
    }

    private void addSignatureSection(Document document) throws Exception {
        PdfPTable signatures = new PdfPTable(2);
        signatures.setWidthPercentage(100f);
        signatures.setSpacingBefore(28f);

        addSignatureCell(signatures, "Supervisor Signature");
        addSignatureCell(signatures, "Dean Office Signature");
        document.add(signatures);
    }

    private void drawBorder(PdfWriter writer, Document document) {
        Rectangle pageSize = document.getPageSize();
        PdfContentByte canvas = writer.getDirectContentUnder();
        canvas.saveState();
        canvas.setLineWidth(1.2f);
        canvas.rectangle(
                document.leftMargin() / 2,
                document.bottomMargin() / 2,
                pageSize.getWidth() - document.leftMargin() - document.rightMargin() / 2,
                pageSize.getHeight() - document.topMargin() - document.bottomMargin()
        );
        canvas.stroke();
        canvas.restoreState();
    }

    private void addCell(PdfPTable table, String label, String value) {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.BLACK);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.BLACK);

        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBackgroundColor(new Color(240, 240, 240));
        labelCell.setPadding(8f);
        labelCell.setBorder(Rectangle.BOX);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, valueFont));
        valueCell.setPadding(8f);
        valueCell.setBorder(Rectangle.BOX);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addSignatureCell(PdfPTable table, String label) {
        PdfPCell cell = new PdfPCell();
        cell.setPadding(18f);
        cell.setBorder(Rectangle.BOX);
        cell.setMinimumHeight(80f);
        cell.setVerticalAlignment(Element.ALIGN_BOTTOM);
        cell.addElement(new Paragraph(label));
        cell.addElement(new Paragraph("\n______________________________"));
        table.addCell(cell);
    }

    private String safeText(String value) {
        return StringUtils.hasText(value) ? value : "N/A";
    }
}




