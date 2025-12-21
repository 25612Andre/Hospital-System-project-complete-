package com.example.hospitalmanagement.repository;

import com.example.hospitalmanagement.model.Location;
import com.example.hospitalmanagement.model.Patient;
import com.example.hospitalmanagement.model.enums.LocationType;
import java.util.Collections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@org.springframework.test.context.ActiveProfiles("test")
class PatientRepositoryTest {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private LocationRepository locationRepository;

    private Location village;

    @BeforeEach
    void setup() {
        Location province = locationRepository.save(Location.builder()
                .code("RW-KGL")
                .name("Kigali")
                .type(LocationType.PROVINCE)
                .build());
        Location district = locationRepository.save(Location.builder()
                .code("RW-KGL-GAS")
                .name("Gasabo")
                .type(LocationType.DISTRICT)
                .parent(province)
                .build());
        village = locationRepository.save(Location.builder()
                .code("RW-KGL-GAS-KIM-001")
                .name("Kimironko Village")
                .type(LocationType.VILLAGE)
                .parent(district)
                .build());

        patientRepository.save(Patient.builder()
                .fullName("Test Patient")
                .age(30)
                .gender("FEMALE")
                .email("patient@example.com")
                .phone("+250700000001")
                .location(village)
                .doctors(Collections.emptySet())
                .build());
    }

    @Test
    void shouldFilterPatientsByEmail() {
        Page<Patient> result = patientRepository.filterPatients(
                null,
                "patient@example.com",
                null,
                null,
                PageRequest.of(0, 5));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent().get(0).getFullName()).isEqualTo("Test Patient");
    }

    @Test
    void shouldReportEmailExistence() {
        boolean exists = patientRepository.existsByEmailIgnoreCase("patient@example.com");
        assertThat(exists).isTrue();
    }
}
