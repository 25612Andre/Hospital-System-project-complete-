package com.example.hospitalmanagement.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import com.example.hospitalmanagement.dto.UserAccountRequest;
import com.example.hospitalmanagement.dto.LocationDTO;
import com.example.hospitalmanagement.model.UserAccount;
import com.example.hospitalmanagement.auth.service.UserAccountService;
import com.example.hospitalmanagement.service.LocationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserAccountController {

    private final UserAccountService userAccountService;
    private final LocationService locationService;

    @GetMapping
    public ResponseEntity<List<UserAccount>> list() {
        return ResponseEntity.ok(userAccountService.getAll());
    }

    @GetMapping("/search")
    public ResponseEntity<Page<UserAccount>> search(@RequestParam @NonNull String q,
                                                    @PageableDefault(sort = "username") Pageable pageable) {
        return ResponseEntity.ok(userAccountService.search(q, pageable));
    }

    @PostMapping
    public ResponseEntity<UserAccount> create(@RequestBody @Valid UserAccountRequest request) {
        return ResponseEntity.ok(userAccountService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserAccount> update(@PathVariable Long id,
                                              @RequestBody @Valid UserAccountRequest request) {
        return ResponseEntity.ok(userAccountService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userAccountService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/province/code/{code}")
    public ResponseEntity<List<UserAccount>> byProvinceCode(@PathVariable String code) {
        return ResponseEntity.ok(userAccountService.byProvinceCode(code));
    }

    @GetMapping("/province/name/{name}")
    public ResponseEntity<List<UserAccount>> byProvinceName(@PathVariable String name) {
        return ResponseEntity.ok(userAccountService.byProvinceName(name));
    }

    @GetMapping("/by-province")
    public ResponseEntity<List<UserAccount>> byProvince(@RequestParam(required = false) String code,
                                                        @RequestParam(required = false) String name) {
        if (code == null && name == null) {
            throw new IllegalArgumentException("Provide province code or name");
        }
        if (code != null) {
            return ResponseEntity.ok(userAccountService.byProvinceCode(code));
        }
        return ResponseEntity.ok(userAccountService.byProvinceName(name));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserAccount> updateProfile(@RequestBody @Valid UserAccountRequest request) {
         // Get current user from SecurityContext
         String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
         return ResponseEntity.ok(userAccountService.updateProfile(username, request));
    }

    @GetMapping("/{id}/location")
    public ResponseEntity<LocationDTO> location(@PathVariable Long id) {
        UserAccount account = userAccountService.getById(id);
        if (account.getLocation() == null) {
            return ResponseEntity.ok(null);
        }
        return ResponseEntity.ok(locationService.get(account.getLocation().getId()));
    }
}
