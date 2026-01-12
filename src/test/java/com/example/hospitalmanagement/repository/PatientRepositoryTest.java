package com.example.hospitalmanagement.repository;

import com.example.hospitalmanagement.model.Location;
import com.example.hospitalmanagement.model.Patient;
import com.example.hospitalmanagement.model.enums.LocationType;
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
        Location provinceToSave = new Location();
        provinceToSave.setCode("RW-KGL");
        provinceToSave.setName("Kigali");
        provinceToSave.setType(LocationType.PROVINCE);
        Location province = locationRepository.save(provinceToSave);

        Location districtToSave = new Location();
        districtToSave.setCode("RW-KGL-GAS");
        districtToSave.setName("Gasabo");
        districtToSave.setType(LocationType.DISTRICT);
        districtToSave.setParent(province);
        Location district = locationRepository.save(districtToSave);

        Location villageToSave = new Location();
        villageToSave.setCode("RW-KGL-GAS-KIM-001");
        villageToSave.setName("Kimironko Village");
        villageToSave.setType(LocationType.VILLAGE);
        villageToSave.setParent(district);
        village = locationRepository.save(villageToSave);

        Patient patient = new Patient();
        patient.setFullName("Test Patient");
        patient.setAge(30);
        patient.setGender("FEMALE");
        patient.setEmail("patient@example.com");
        patient.setPhone("+250700000001");
        patient.setLocation(village);
        patientRepository.save(patient);
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
