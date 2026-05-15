package com.example.hospitalmanagement.auth.controller;

import com.example.hospitalmanagement.auth.service.MailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerForgotPasswordTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MailService mailService;

    @Test
    void shouldReturnResetTokenWhenMailDeliveryFails() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SMTP delivery failed. Check mail configuration and retry."))
                .when(mailService)
                .send(anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType("application/json")
                        .content("""
                                {
                                  "email": "user@example.com"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailSent").value(false))
                .andExpect(jsonPath("$.resetToken").isNotEmpty())
                .andExpect(jsonPath("$.message").value("Email delivery is unavailable right now. Use the reset code below."));
    }
}
