package com.example.hospitalmanagement.controller;

import com.example.hospitalmanagement.model.Location;
import com.example.hospitalmanagement.model.Patient;
import com.example.hospitalmanagement.model.enums.LocationType;
import com.example.hospitalmanagement.repository.LocationRepository;
import com.example.hospitalmanagement.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private LocationRepository locationRepository;

    @BeforeEach
    void prepareData() {
        patientRepository.deleteAll();
        locationRepository.deleteAll();
        Location provinceToSave = new Location();
        provinceToSave.setCode("RW-SOUTH");
        provinceToSave.setName("Southern");
        provinceToSave.setType(LocationType.PROVINCE);
        Location province = locationRepository.save(provinceToSave);

        Location villageToSave = new Location();
        villageToSave.setCode("RW-SOUTH-01");
        villageToSave.setName("Huye");
        villageToSave.setType(LocationType.VILLAGE);
        villageToSave.setParent(province);
        Location village = locationRepository.save(villageToSave);

        Patient patient = new Patient();
        patient.setFullName("Controller Test Patient");
        patient.setAge(40);
        patient.setGender("MALE");
        patient.setEmail("controller@test.rw");
        patient.setPhone("+250700000099");
        patient.setLocation(village);
        patientRepository.save(patient);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void shouldReturnPaginatedPatients() throws Exception {
        mockMvc.perform(get("/api/patients/page")
                        .param("page", "0")
                        .param("size", "5")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].fullName").value("Controller Test Patient"));
    }
}
