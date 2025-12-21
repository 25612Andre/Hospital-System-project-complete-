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
        Location province = locationRepository.save(Location.builder()
                .code("RW-SOUTH")
                .name("Southern")
                .type(LocationType.PROVINCE)
                .build());
        Location village = locationRepository.save(Location.builder()
                .code("RW-SOUTH-01")
                .name("Huye")
                .type(LocationType.VILLAGE)
                .parent(province)
                .build());
        patientRepository.save(Patient.builder()
                .fullName("Controller Test Patient")
                .age(40)
                .gender("MALE")
                .email("controller@test.rw")
                .phone("+250700000099")
                .location(village)
                .build());
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
