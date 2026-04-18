package com.example.hospitalmanagement.auth.service;

import com.example.hospitalmanagement.auth.dto.AuthRequest;
import com.example.hospitalmanagement.auth.dto.AuthResponse;
import com.example.hospitalmanagement.dto.ProfileUpdateRequest;
import com.example.hospitalmanagement.dto.UserAccountRequest;
import com.example.hospitalmanagement.model.Doctor;
import com.example.hospitalmanagement.model.Location;
import com.example.hospitalmanagement.model.Patient;
import com.example.hospitalmanagement.model.UserAccount;
import com.example.hospitalmanagement.model.enums.LocationType;
import com.example.hospitalmanagement.model.enums.Role;
import com.example.hospitalmanagement.repository.DoctorRepository;
import com.example.hospitalmanagement.repository.LocationRepository;
import com.example.hospitalmanagement.repository.PatientRepository;
import com.example.hospitalmanagement.repository.UserAccountRepository;
import com.example.hospitalmanagement.service.LocationService;
import com.example.hospitalmanagement.service.DoctorService;
import com.example.hospitalmanagement.security.JwtService;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final com.example.hospitalmanagement.repository.DepartmentRepository departmentRepository;
    private final DoctorService doctorService;
    private final LocationRepository locationRepository;
    private final LocationService locationService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final com.example.hospitalmanagement.service.FileStorageService fileStorageService;

    public List<UserAccount> getAll() {
        return userAccountRepository.findAll();
    }

    public UserAccount getById(@NonNull Long id) {
        return userAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Page<UserAccount> search(@NonNull String term, @NonNull Pageable pageable) {
        String normalized = term.trim();
        if (normalized.isEmpty()) {
            return userAccountRepository.findAll(pageable);
        }
        Role parsedRole = parseRole(normalized);
        if (parsedRole != null) {
            return userAccountRepository.searchFullWithRole(normalized, parsedRole, pageable);
        }
        return userAccountRepository.searchFull(normalized, pageable);
    }

    public UserAccount create(@NonNull UserAccountRequest req) {
        return create(req, null);
    }

    public UserAccount create(@NonNull UserAccountRequest req, org.springframework.web.multipart.MultipartFile profilePicture) {
        // Trigger recompile
        ensureUsernameAvailable(req.getUsername(), null);
        
        // Handle profile picture upload
        String profilePictureUrl = null;
        if (profilePicture != null && !profilePicture.isEmpty()) {
            if (!fileStorageService.isValidImageFile(profilePicture)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image file. Please upload JPG, PNG, GIF, or WEBP (max 5MB)");
            }
            try {
                profilePictureUrl = fileStorageService.storeFile(profilePicture);
            } catch (java.io.IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store profile picture");
            }
        }
        
        UserAccount ua = new UserAccount();
        bindCommonFields(ua, req, true, profilePictureUrl);
        return userAccountRepository.save(ua);
    }

    public UserAccount update(@NonNull Long id, @NonNull UserAccountRequest req) {
        UserAccount ua = userAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User account not found"));
        ensureUsernameAvailable(req.getUsername(), id);
        bindCommonFields(ua, req, false);
        return userAccountRepository.save(ua);
    }

    public void delete(@NonNull Long id) {
        userAccountRepository.deleteById(id);
    }

    public List<UserAccount> byProvinceCode(@NonNull String code) {
        Location province = locationService.requireByTypeAndCode(LocationType.PROVINCE, code);
        List<Long> locationIds = locationService.collectDescendantIds(province);
        return userAccountRepository.findByLocation_IdIn(locationIds);
    }

    public List<UserAccount> byProvinceName(@NonNull String name) {
        Location province = locationService.requireByTypeAndName(LocationType.PROVINCE, name);
        List<Long> locationIds = locationService.collectDescendantIds(province);
        return userAccountRepository.findByLocation_IdIn(locationIds);
    }

    public Optional<UserAccount> findOptional(String username) {
        return userAccountRepository.findByUsernameIgnoreCase(username);
    }

    public UserAccount findByUsername(String username) {
        return findOptional(username).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public AuthResponse login(AuthRequest req) {
        UserAccount ua = findOptional(req.getUsername())
                .filter(user -> passwordEncoder.matches(req.getPassword(), user.getPassword()))
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        Long patientId = ua.getPatient() != null ? ua.getPatient().getId() : null;
        Long doctorId = ua.getDoctor() != null ? ua.getDoctor().getId() : null;
        AuthResponse.UserInfo info = new AuthResponse.UserInfo(
                ua.getId(),
                ua.getUsername(),
                ua.getRole(),
                patientId,
                doctorId,
                ua.getProfilePictureUrl()
        );
        String token = jwtService.generateToken(ua);
        return new AuthResponse(token, info, false);
    }

    public UserAccount authenticate(AuthRequest req) {
        return findOptional(req.getUsername())
                .filter(user -> passwordEncoder.matches(req.getPassword(), user.getPassword()))
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));
    }

    @org.springframework.transaction.annotation.Transactional
    public void updatePassword(String email, String newPassword) {
        UserAccount ua = userAccountRepository.findByUsernameIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ua.setPassword(passwordEncoder.encode(newPassword));
        userAccountRepository.save(ua);
    }

    public UserAccount updateTwoFactor(UserAccount user, boolean enabled) {
        user.setTwoFactorEnabled(enabled);
        return userAccountRepository.save(user);
    }

    private void bindCommonFields(UserAccount ua, UserAccountRequest req, boolean create, String profilePictureUrl) {
        ua.setUsername(req.getUsername());
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            ua.setPassword(passwordEncoder.encode(req.getPassword()));
        } else if (create) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }
        ua.setRole(req.getRole());
        if (req.getTwoFactorEnabled() != null) {
            ua.setTwoFactorEnabled(req.getTwoFactorEnabled());
        }
        if (profilePictureUrl != null && !profilePictureUrl.isBlank()) {
            ua.setProfilePictureUrl(profilePictureUrl);
        }
        ua.setPatient(null);
        ua.setDoctor(null);
        
        // Handle Location by Name or ID
        Location location = resolveLocation(req);
        ua.setLocation(location);
        
        enforceRoleLinks(ua, req, profilePictureUrl, location);
    }
    
    // Overload for backward compatibility
    private void bindCommonFields(UserAccount ua, UserAccountRequest req, boolean create) {
        bindCommonFields(ua, req, create, null);
    }

    private Location resolveLocation(UserAccountRequest req) {
        if (req.getLocationId() != null) {
            return locationRepository.findById(req.getLocationId()).orElse(null);
        }
        if (req.getLocationName() != null && !req.getLocationName().isBlank()) {
            String name = req.getLocationName().trim();
            return locationRepository.findByNameIgnoreCase(name)
                    .orElseGet(() -> {
                        Location loc = new Location();
                        loc.setName(name);
                        loc.setCode(name.toUpperCase().replaceAll("\\s+", "_") + "-" + System.currentTimeMillis());
                        loc.setType(LocationType.PROVINCE); // Default to a flat type
                        return locationRepository.save(loc);
                    });
        }
        return null;
    }

    private Role parseRole(String value) {
        try {
            return Role.valueOf(value.toUpperCase());
        } catch (Exception ex) {
            return null;
        }
    }

    private void ensureUsernameAvailable(String username, Long currentId) {
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }
        String normalized = username.trim();
        if (currentId == null) {
            if (userAccountRepository.existsByUsernameIgnoreCase(normalized)) {
                 throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use");
            }
        } else {
             userAccountRepository.findByUsernameIgnoreCase(normalized)
                .filter(existing -> !existing.getId().equals(currentId))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use");
                });
        }
    }

    public UserAccount updateProfile(String username, ProfileUpdateRequest req) {
        UserAccount ua = findByUsername(username);
        
        // Allow password update
        if (hasText(req.getPassword())) {
            ua.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        
        // Allow updating linked entities
        Patient patient = ua.getPatient();
        if (patient != null) {
            if (hasText(req.getFullName())) patient.setFullName(req.getFullName().trim());
            if (hasText(req.getPhone())) {
                String normalizedPhone = req.getPhone().trim();
                if (!normalizedPhone.equals(patient.getPhone()) && patientRepository.existsByPhone(normalizedPhone)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone already registered for another patient");
                }
                patient.setPhone(normalizedPhone);
            }
            if (hasText(req.getGender())) patient.setGender(req.getGender().trim());
            if (req.getAge() != null && req.getAge() > 0) patient.setAge(req.getAge());
            // Email kept manually or same as username?
            patientRepository.save(patient);
        }
        
        Doctor doctor = ua.getDoctor();
        if (doctor != null) {
            if (hasText(req.getFullName())) doctor.setName(req.getFullName().trim());
            if (hasText(req.getPhone())) doctor.setContact(req.getPhone().trim());
            if (hasText(req.getSpecialization())) doctor.setSpecialization(req.getSpecialization().trim());
            doctorService.update(doctor.getId(), doctor);
        }

        return userAccountRepository.save(ua);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    @org.springframework.transaction.annotation.Transactional
    public UserAccount updateProfilePicture(String username, org.springframework.web.multipart.MultipartFile profilePicture) {
        if (profilePicture == null || profilePicture.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile picture is required");
        }
        if (!fileStorageService.isValidImageFile(profilePicture)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image file. Please upload JPG, PNG, GIF, or WEBP (max 5MB)");
        }

        UserAccount ua = findByUsername(username);
        String oldUrl = ua.getProfilePictureUrl();

        String newUrl;
        try {
            newUrl = fileStorageService.storeFile(profilePicture);
        } catch (java.io.IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store profile picture");
        }

        ua.setProfilePictureUrl(newUrl);
        UserAccount saved = userAccountRepository.save(ua);

        Patient patient = saved.getPatient();
        if (patient != null) {
            patient.setProfilePictureUrl(newUrl);
            patientRepository.save(patient);
        }

        Doctor doctor = saved.getDoctor();
        if (doctor != null) {
            doctor.setProfilePictureUrl(newUrl);
            doctorService.update(doctor.getId(), doctor);
        }

        if (oldUrl != null && !oldUrl.isBlank() && !oldUrl.equals(newUrl)) {
            fileStorageService.deleteFile(oldUrl);
        }

        return saved;
    }
    
    
    private void enforceRoleLinks(UserAccount ua, UserAccountRequest req, String profilePictureUrl, Location location) {
        Role role = req.getRole();
        if (role == Role.ADMIN) {
            ua.setPatient(null);
            ua.setDoctor(null);
            return;
        }
        if (role == Role.PATIENT) {
            Long patientId = req.getPatientId();
            if (patientId != null) {
                Patient patient = patientRepository.findById(patientId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Patient not found"));
                ua.setPatient(patient);
            } else if (req.getFullName() != null && !req.getFullName().isBlank()) {
                // Self-registration flow: Create new Patient
                String username = req.getUsername();
                if (username == null || username.isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
                }
                String phone = req.getPhone();
                if (phone == null || phone.isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone is required for new patient registration");
                }
                if (patientRepository.existsByEmailIgnoreCase(username)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered for another patient");
                }
                if (patientRepository.existsByPhone(phone)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone already registered for another patient");
                }
                Long locationId = req.getLocationId();
                if (location == null && locationId != null) {
                     location = locationRepository.findById(locationId).orElse(null);
                }
                if (location == null && req.getLocationName() != null && !req.getLocationName().isBlank()) {
                     location = resolveLocation(req);
                }
                         
                Patient newPatient = new Patient();
                newPatient.setFullName(req.getFullName());
                newPatient.setAge(req.getAge());
                newPatient.setGender(req.getGender());
                newPatient.setEmail(username); // Use username as email
                newPatient.setPhone(phone);
                newPatient.setLocation(location);
                newPatient.setProfilePictureUrl(profilePictureUrl); // Set profile picture
                
                Patient saved = patientRepository.save(newPatient);
                ua.setPatient(saved);
            }
            // If neither patientId nor fullName provided, leave patient as null (admin can create unlinked user)
            ua.setDoctor(null);
            return;
        }
        if (role == Role.DOCTOR) {
            Long doctorId = req.getDoctorId();
            if (doctorId != null) {
                 // Link to existing doctor
                 if (userAccountRepository.existsByDoctor_Id(doctorId)) {
                      throw new ResponseStatusException(HttpStatus.CONFLICT, "This Doctor profile is already linked to a user account.");
                 }
                 Doctor doctor = doctorRepository.findById(doctorId)
                         .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor not found"));
                 ua.setDoctor(doctor);
            } else if (req.getFullName() != null && !req.getFullName().isBlank()) {
                // Self-registration for Doctor
                Long departmentId = req.getDepartmentId();
                if (departmentId == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department is required for new doctor registration");
                }
                com.example.hospitalmanagement.model.Department department = departmentRepository.findById(departmentId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));

                Location doctorLocation = null;
                Long locationId = req.getLocationId();
                if (locationId != null) {
                    doctorLocation = locationRepository.findById(locationId)
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location not found"));
                }

                Doctor newDoctor = new Doctor();
                newDoctor.setName(req.getFullName());
                newDoctor.setContact(req.getPhone());
                newDoctor.setSpecialization(req.getSpecialization() != null ? req.getSpecialization() : department.getName());
                newDoctor.setDepartment(department);
                newDoctor.setLocation(doctorLocation);
                newDoctor.setProfilePictureUrl(profilePictureUrl);

                Doctor saved = doctorService.save(newDoctor);
                ua.setDoctor(saved);
            }
            // If neither doctorId nor fullName provided, leave doctor as null (admin can create unlinked user)
            ua.setPatient(null);
        }
    }
    
    // Overload for backward compatibility
    private void enforceRoleLinks(UserAccount ua, UserAccountRequest req) {
        enforceRoleLinks(ua, req, null);
    }
}
