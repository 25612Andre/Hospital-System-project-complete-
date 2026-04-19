package com.example.hospitalmanagement.auth.controller;

import com.example.hospitalmanagement.model.UserAccount;
import com.example.hospitalmanagement.model.enums.Role;
import com.example.hospitalmanagement.repository.UserAccountRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerLoginTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void prepareData() {
        userAccountRepository.deleteAll();
    }

    @Test
    void shouldLoginSuccessfullyWhenUsernameHasSurroundingSpaces() throws Exception {
        UserAccount user = new UserAccount();
        user.setUsername("trimmed@login.test");
        user.setPassword(passwordEncoder.encode("secret123"));
        user.setRole(Role.ADMIN);
        user.setEnabled(true);
        userAccountRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "  trimmed@login.test  ",
                                  "password": "secret123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.requires2fa").value(false))
                .andExpect(jsonPath("$.user.username").value("trimmed@login.test"));
    }

    @Test
    void shouldReturnForbiddenForDisabledAccount() throws Exception {
        UserAccount user = new UserAccount();
        user.setUsername("disabled@login.test");
        user.setPassword(passwordEncoder.encode("secret123"));
        user.setRole(Role.ADMIN);
        user.setEnabled(false);
        userAccountRepository.save(user);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "disabled@login.test",
                                  "password": "secret123"
                                }
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Account is disabled. Please contact administrator."));
    }
}
