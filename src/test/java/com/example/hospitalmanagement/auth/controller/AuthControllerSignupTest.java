package com.example.hospitalmanagement.auth.controller;

import com.example.hospitalmanagement.model.Location;
import com.example.hospitalmanagement.model.Patient;
import com.example.hospitalmanagement.model.enums.LocationType;
import com.example.hospitalmanagement.repository.LocationRepository;
import com.example.hospitalmanagement.repository.PatientRepository;
import com.example.hospitalmanagement.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerSignupTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @BeforeEach
    void prepareData() {
        userAccountRepository.deleteAll();
        patientRepository.deleteAll();
        locationRepository.deleteAll();
    }

    @Test
    void shouldReturnConflictWhenPhoneAlreadyExists() throws Exception {
        Location locationToSave = new Location();
        locationToSave.setCode("RW-KIGALI-01");
        locationToSave.setName("Bwiza");
        locationToSave.setType(LocationType.VILLAGE);
        Location location = locationRepository.save(locationToSave);

        Patient existing = new Patient();
        existing.setFullName("Existing Patient");
        existing.setAge(30);
        existing.setGender("FEMALE");
        existing.setEmail("existing@patient.rw");
        existing.setPhone("+25074292659");
        existing.setLocation(location);
        patientRepository.save(existing);

        mockMvc.perform(multipart("/api/auth/signup")
                        .param("username", "newuser@patient.rw")
                        .param("password", "password123")
                        .param("role", "PATIENT")
                        .param("fullName", "New Patient")
                        .param("age", "23")
                        .param("gender", "FEMALE")
                        .param("phone", "+25074292659")
                        .param("locationId", location.getId().toString()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Phone already registered for another patient"));
    }
}
