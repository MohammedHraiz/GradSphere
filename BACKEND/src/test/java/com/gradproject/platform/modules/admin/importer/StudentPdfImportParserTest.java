package com.gradproject.platform.modules.admin.importer;

import com.gradproject.platform.modules.user.UserDepartment;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

class StudentPdfImportParserTest {

    private final StudentPdfImportParser parser = new StudentPdfImportParser();

    @Test
    void detectsDepartmentFromHeader() {
        String text = "المشروع لطلبة علم الحاسوب";

        StudentPdfImportParser.ParsedStudentBatch batch = parser.parseText(text);

        assertThat(batch.department()).isEqualTo(UserDepartment.COMPUTER_SCIENCE);
    }

    @Test
    void extractsRowsFromInlineText() {
        String text = "المشروع لطلبة علم الحاسوب\n" +
                "1 32201001145 أحمد محمد\n" +
                "2 32201001146 ليلى علي\n" +
                "لم يتقدم\n";

        StudentPdfImportParser.ParsedStudentBatch batch = parser.parseText(text);

        assertThat(batch.rows()).hasSize(2);
        assertThat(batch.rows().get(0).universityId()).isEqualTo("32201001145");
        assertThat(batch.rows().get(0).name()).isEqualTo("أحمد محمد");
        assertThat(batch.rows().get(1).universityId()).isEqualTo("32201001146");
        assertThat(batch.rows().get(1).name()).isEqualTo("ليلى علي");
    }

    @Test
    void pairsIdsAndNamesFromSeparatePdfBlocks() {
        String text = "32201001145\n" +
                "32301001045\n" +
                "الرقم الجامعي\n" +
                "احمد عيسى عبد القادر النويهي\n" +
                "احمد محمد اسماعيل الربيعي\n" +
                "اسم الطالب\n";

        StudentPdfImportParser.ParsedStudentBatch batch = parser.parseText(text);

        assertThat(batch.rows()).hasSize(2);
        assertThat(batch.rows().get(0).universityId()).isEqualTo("32201001145");
        assertThat(batch.rows().get(0).name()).isEqualTo("احمد عيسى عبد القادر النويهي");
        assertThat(batch.rows().get(1).universityId()).isEqualTo("32301001045");
        assertThat(batch.rows().get(1).name()).isEqualTo("احمد محمد اسماعيل الربيعي");
    }

    @Test
    void extractsRowsFromPdfFixtureWhenAvailable() throws Exception {
        Path repoFixturePath = Path.of("src/test/resources/fixtures/CS.Names.pdf");
        Path localSamplePath = Path.of("C:/Users/moham/Downloads/CS.Names.pdf");
        Path fixturePath = Files.exists(repoFixturePath) ? repoFixturePath : localSamplePath;
        Assumptions.assumeTrue(Files.exists(fixturePath));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "CS.Names.pdf",
                "application/pdf",
                Files.readAllBytes(fixturePath)
        );

        StudentPdfImportParser.ParsedStudentBatch batch = parser.parse(file);

        assertThat(batch.rows()).hasSize(118);
        assertThat(batch.rows().get(0).universityId()).isEqualTo("32201001145");
        assertThat(batch.rows().get(0).name()).isEqualTo("احمد عيسى عبد القادر النويهي");
        assertThat(batch.department()).isEqualTo(UserDepartment.COMPUTER_SCIENCE);
    }
}
