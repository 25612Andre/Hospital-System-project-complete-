package com.example.hospitalmanagement.auth.service;

import com.example.hospitalmanagement.auth.dto.AuthRequest;
import com.example.hospitalmanagement.auth.dto.AuthResponse;
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
    private final LocationRepository locationRepository;
    private final LocationService locationService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public List<UserAccount> getAll() {
        return userAccountRepository.findAll();
    }

    public UserAccount getById(Long id) {
        return userAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Page<UserAccount> search(@NonNull String term, Pageable pageable) {
        String normalized = term.trim();
        if (normalized.isEmpty()) {
            return userAccountRepository.findAll(pageable);
        }
        Role parsedRole = parseRole(normalized);
        if (parsedRole != null) {
            return userAccountRepository.findByUsernameContainingIgnoreCaseOrPatient_FullNameContainingIgnoreCaseOrRole(
                    normalized, normalized, parsedRole, pageable);
        }
        return userAccountRepository.findByUsernameContainingIgnoreCaseOrPatient_FullNameContainingIgnoreCase(
                normalized, normalized, pageable);
    }

    public UserAccount create(@NonNull UserAccountRequest req) {
        // Trigger recompile
        ensureUsernameAvailable(req.getUsername(), null);
        UserAccount ua = new UserAccount();
        bindCommonFields(ua, req, true);
        return userAccountRepository.save(ua);
    }

    public UserAccount update(Long id, UserAccountRequest req) {
        UserAccount ua = userAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User account not found"));
        ensureUsernameAvailable(req.getUsername(), id);
        bindCommonFields(ua, req, false);
        return userAccountRepository.save(ua);
    }

    public void delete(Long id) {
        userAccountRepository.deleteById(id);
    }

    public List<UserAccount> byProvinceCode(String code) {
        Location province = locationService.requireByTypeAndCode(LocationType.PROVINCE, code);
        List<Long> locationIds = locationService.collectDescendantIds(province);
        return userAccountRepository.findByLocation_IdIn(locationIds);
    }

    public List<UserAccount> byProvinceName(String name) {
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
        AuthResponse.UserInfo info = new AuthResponse.UserInfo(ua.getId(), ua.getUsername(), ua.getRole(), patientId, doctorId);
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

    private void bindCommonFields(UserAccount ua, UserAccountRequest req, boolean create) {
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
        ua.setPatient(null);
        ua.setDoctor(null);
        enforceRoleLinks(ua, req);
        assignLocation(ua, req);
    }

    private void assignLocation(UserAccount ua, UserAccountRequest req) {
        if (req.getLocationId() != null) {
            Location location = locationRepository.findById(req.getLocationId())
                    .orElseThrow(() -> new RuntimeException("Location not found"));
            ua.setLocation(location);
            return;
        }
        if (ua.getPatient() != null && ua.getPatient().getLocation() != null) {
            ua.setLocation(ua.getPatient().getLocation());
        }
    }

    private Role parseRole(String value) {
        try {
            return Role.valueOf(value.toUpperCase());
        } catch (Exception ex) {
            return null;
        }
    }

    private void ensureUsernameAvailable(@NonNull String username, Long currentId) {
        if (currentId == null) {
            if (userAccountRepository.existsByUsernameIgnoreCase(username)) {
                 throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use");
            }
        } else {
             userAccountRepository.findByUsernameIgnoreCase(username)
                .filter(existing -> !existing.getId().equals(currentId))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already in use");
                });
        }
    }

    public UserAccount updateProfile(String username, UserAccountRequest req) {
        UserAccount ua = findByUsername(username);
        
        // Allow password update
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            ua.setPassword(passwordEncoder.encode(req.getPassword()));
        }
        
        // Allow updating linked entities
        if (ua.getPatient() != null) {
            Patient p = ua.getPatient();
            if (req.getFullName() != null) p.setFullName(req.getFullName());
            if (req.getPhone() != null) p.setPhone(req.getPhone());
            if (req.getGender() != null) p.setGender(req.getGender());
            if (req.getAge() != null) p.setAge(req.getAge());
            // Email kept manually or same as username?
            patientRepository.save(p);
        }
        
        if (ua.getDoctor() != null) {
            Doctor d = ua.getDoctor();
            if (req.getFullName() != null) d.setName(req.getFullName());
            if (req.getPhone() != null) d.setContact(req.getPhone());
            if (req.getSpecialization() != null) d.setSpecialization(req.getSpecialization());
            doctorRepository.save(d);
        }

        return userAccountRepository.save(ua);
    }
    
    private void enforceRoleLinks(UserAccount ua, UserAccountRequest req) {
        Role role = req.getRole();
        if (role == Role.ADMIN) {
            ua.setPatient(null);
            ua.setDoctor(null);
            return;
        }
        if (role == Role.PATIENT) {
            if (req.getPatientId() != null) {
                Patient patient = patientRepository.findById(req.getPatientId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Patient not found"));
                ua.setPatient(patient);
            } else if (req.getFullName() != null && !req.getFullName().isBlank()) {
                // Self-registration flow: Create new Patient
                if (req.getLocationId() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location is required for new patient registration");
                }
                Location location = locationRepository.findById(req.getLocationId())
                         .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location not found"));
                         
                Patient newPatient = new Patient();
                newPatient.setFullName(req.getFullName());
                newPatient.setAge(req.getAge());
                newPatient.setGender(req.getGender());
                newPatient.setEmail(req.getUsername()); // Use username as email
                newPatient.setPhone(req.getPhone());
                newPatient.setLocation(location);
                
                Patient saved = patientRepository.save(newPatient);
                ua.setPatient(saved);
            }
            // If neither patientId nor fullName provided, leave patient as null (admin can create unlinked user)
            ua.setDoctor(null);
            return;
        }
        if (role == Role.DOCTOR) {
            if (req.getDoctorId() != null) {
                 // Link to existing doctor
                 if (userAccountRepository.existsByDoctor_Id(req.getDoctorId())) {
                      throw new ResponseStatusException(HttpStatus.CONFLICT, "This Doctor profile is already linked to a user account.");
                 }
                 Doctor doctor = doctorRepository.findById(req.getDoctorId())
                         .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor not found"));
                 ua.setDoctor(doctor);
            } else if (req.getFullName() != null && !req.getFullName().isBlank()) {
                // Self-registration for Doctor
                if (req.getDepartmentId() == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department is required for new doctor registration");
                }
                com.example.hospitalmanagement.model.Department department = departmentRepository.findById(req.getDepartmentId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Department not found"));

                Location doctorLocation = null;
                if (req.getLocationId() != null) {
                    doctorLocation = locationRepository.findById(req.getLocationId())
                            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Location not found"));
                }

                Doctor newDoctor = Doctor.builder()
                        .name(req.getFullName())
                        .contact(req.getPhone())
                        .specialization(req.getSpecialization() != null ? req.getSpecialization() : department.getName())
                        .department(department)
                        .location(doctorLocation)
                        .build();

                Doctor saved = doctorRepository.save(newDoctor);
                ua.setDoctor(saved);
            }
            // If neither doctorId nor fullName provided, leave doctor as null (admin can create unlinked user)
            ua.setPatient(null);
        }
    }
}
