package com.example.hospitalmanagement.auth.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class TwoFactorAuthServiceTest {

    @Mock
    private MailService mailService;

    @Test
    void shouldFailFastAndClearPendingCodeWhenSmtpDeliveryFails() {
        TwoFactorAuthService service = new TwoFactorAuthService(mailService);
        doThrow(new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "SMTP delivery failed. Check mail configuration and retry."))
                .when(mailService)
                .send(anyString(), anyString(), anyString());

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> service.dispatchCode("admin@example.com"));

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getStatusCode());
        @SuppressWarnings("unchecked")
        Map<String, ?> pendingCodes = (Map<String, ?>) ReflectionTestUtils.getField(service, "pendingCodes");
        assertTrue(pendingCodes.isEmpty());
    }
}
