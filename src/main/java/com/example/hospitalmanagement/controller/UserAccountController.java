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
import com.example.hospitalmanagement.dto.ProfileUpdateRequest;
import com.example.hospitalmanagement.model.UserAccount;
import com.example.hospitalmanagement.auth.service.UserAccountService;
import com.example.hospitalmanagement.service.LocationService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;

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
    public ResponseEntity<Page<UserAccount>> search(@RequestParam(required = false) String q,
                                                    @NonNull @PageableDefault(sort = "username") Pageable pageable) {
        return ResponseEntity.ok(userAccountService.search(q, pageable));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserAccount> create(@RequestBody @Valid @NonNull UserAccountRequest request) {
        return ResponseEntity.ok(userAccountService.create(request));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserAccount> createMultipart(
            @ModelAttribute @Valid @NonNull UserAccountRequest request,
            @RequestParam(value = "profilePicture", required = false) org.springframework.web.multipart.MultipartFile profilePicture) {
        return ResponseEntity.ok(userAccountService.create(request, profilePicture));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserAccount> update(@PathVariable @NonNull Long id,
                                              @RequestBody @Valid @NonNull UserAccountRequest request) {
        return ResponseEntity.ok(userAccountService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NonNull Long id) {
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
    public ResponseEntity<UserAccount> updateProfile(@RequestBody ProfileUpdateRequest request) {
         // Get current user from SecurityContext
         String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
         return ResponseEntity.ok(userAccountService.updateProfile(username, request));
    }

    @GetMapping("/profile")
    public ResponseEntity<UserAccount> profile() {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userAccountService.findByUsername(username));
    }

    @PutMapping(value = "/profile-picture", consumes = {"multipart/form-data"})
    public ResponseEntity<UserAccount> updateProfilePicture(
            @RequestParam("profilePicture") org.springframework.web.multipart.MultipartFile profilePicture) {
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(userAccountService.updateProfilePicture(username, profilePicture));
    }

    @GetMapping("/{id}/location")
    public ResponseEntity<LocationDTO> location(@PathVariable @NonNull Long id) {
        UserAccount account = userAccountService.getById(id);
        if (account.getLocation() == null) {
            return ResponseEntity.ok(null);
        }
        return ResponseEntity.ok(locationService.get(account.getLocation().getId()));
    }
}
