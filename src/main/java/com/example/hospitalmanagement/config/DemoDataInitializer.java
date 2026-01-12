package com.example.hospitalmanagement.config;

import com.example.hospitalmanagement.model.Appointment;
import com.example.hospitalmanagement.model.Bill;
import com.example.hospitalmanagement.model.Department;
import com.example.hospitalmanagement.model.Doctor;
import com.example.hospitalmanagement.model.Location;
import com.example.hospitalmanagement.model.Patient;
import com.example.hospitalmanagement.model.UserAccount;
import com.example.hospitalmanagement.model.enums.LocationType;
import com.example.hospitalmanagement.model.enums.Role;
import com.example.hospitalmanagement.repository.AppointmentRepository;
import com.example.hospitalmanagement.repository.BillingRepository;
import com.example.hospitalmanagement.repository.DepartmentRepository;
import com.example.hospitalmanagement.repository.DoctorRepository;
import com.example.hospitalmanagement.repository.LocationRepository;
import com.example.hospitalmanagement.repository.PatientRepository;
import com.example.hospitalmanagement.repository.UserAccountRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.demo-data.enabled", havingValue = "true")
@Profile("!test")
public class DemoDataInitializer implements CommandLineRunner {

    private final LocationRepository locationRepository;
    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillingRepository billingRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Initializing demo data...");
        
        // Find or create a default location for the admin
        Location adminLocation = findOrCreateDefaultLocation();

        // Ensure admin always exists with correct password
        ensureAdmin("apjr.nzendong@gmail.com", "admin123", adminLocation);

        // Skip rest if other users exist
        if (userAccountRepository.count() > 1) {
            log.info("Demo data already exists, skipping...");
            return;
        }

        // Departments
        Department cardiology = ensureDepartment("Cardiology", 45000.0);
        Department pediatrics = ensureDepartment("Pediatrics", 30000.0);
        Department radiology = ensureDepartment("Radiology", 60000.0);
        ensureDepartment("General Medicine", 20000.0);

        // Doctors
        Doctor drAlice = ensureDoctor("Dr. Alice Mugabo", "+250788000111", "Cardiologist", cardiology);
        Doctor drEric = ensureDoctor("Dr. Eric Uwera", "+250788000222", "Pediatrician", pediatrics);
        ensureDoctor("Dr. Sarah Habimana", "+250788000333", "Radiologist", radiology);

        // Patients (use admin location for simplicity)
        Patient patientMia = ensurePatient("Mia Imanishimwe", 32, "FEMALE", "mia@demo.rw", "+250780000001", adminLocation, Set.of(drAlice));
        Patient patientNoah = ensurePatient("Noah Hakizimana", 8, "MALE", "noah@demo.rw", "+250780000002", adminLocation, Set.of(drEric));

        // Appointments
        if (appointmentRepository.count() == 0) {
            Appointment todayAppointment = new Appointment();
            todayAppointment.setDoctor(drAlice);
            todayAppointment.setPatient(patientMia);
            todayAppointment.setAppointmentDate(LocalDateTime.now().plusHours(2));
            todayAppointment.setStatus("Scheduled");
            todayAppointment.setConsultationFee(30000.0);
            todayAppointment.setCreatedAt(LocalDateTime.now().minusDays(1));
            todayAppointment = appointmentRepository.save(todayAppointment);

            Appointment pastAppointment = new Appointment();
            pastAppointment.setDoctor(drEric);
            pastAppointment.setPatient(patientNoah);
            pastAppointment.setAppointmentDate(LocalDateTime.now().minusDays(1));
            pastAppointment.setStatus("Completed");
            pastAppointment.setConsultationFee(25000.0);
            pastAppointment.setCreatedAt(LocalDateTime.now().minusDays(2));
            pastAppointment = appointmentRepository.save(pastAppointment);

            // Bills
            Bill paidBill = new Bill();
            paidBill.setAppointment(pastAppointment);
            paidBill.setAmount(pastAppointment.getConsultationFee());
            paidBill.setStatus("Paid");
            paidBill.setIssuedDate(LocalDateTime.now().minusDays(1));
            billingRepository.save(paidBill);

            Bill pendingBill = new Bill();
            pendingBill.setAppointment(todayAppointment);
            pendingBill.setAmount(todayAppointment.getConsultationFee());
            pendingBill.setStatus("Pending");
            pendingBill.setIssuedDate(LocalDateTime.now());
            billingRepository.save(pendingBill);
        }

        // User accounts for doctor and patient
        ensureUser("alice@hospital.rw", "password", Role.DOCTOR, adminLocation, null, drAlice);
        ensureUser("mia@hospital.rw", "password", Role.PATIENT, adminLocation, patientMia, null);

        log.info("Demo data initialized successfully!");
    }

    /**
     * Find an existing location or create a minimal one for demo purposes.
     * Prefers to use existing locations from the database (e.g., from locations.json import).
     */
    private Location findOrCreateDefaultLocation() {
        // Try to find any existing PROVINCE first
        List<Location> provinces = locationRepository.findByType(LocationType.PROVINCE);
        if (!provinces.isEmpty()) {
            // Prefer KIGALI if it exists
            for (Location p : provinces) {
                if (p.getName().toUpperCase().contains("KIGALI")) {
                    return p;
                }
            }
            // Otherwise use any province
            return provinces.get(0);
        }
        
        // No provinces exist, create a minimal one for demo
        Location created = new Location();
        created.setCode("DEMO");
        created.setName("Demo Location");
        created.setType(LocationType.PROVINCE);
        return locationRepository.save(created);
    }

    private void ensureAdmin(String username, String password, Location location) {
        Optional<UserAccount> existing = userAccountRepository.findByUsernameIgnoreCase(username);
        if (existing.isPresent()) {
            UserAccount admin = existing.get();
            // Do not reset password if account exists, to allow manual changes/resets.
            // Only ensure role is ADMIN.
            if (admin.getRole() != Role.ADMIN) {
                admin.setRole(Role.ADMIN);
                userAccountRepository.save(admin);
            }
        } else {
            UserAccount admin = new UserAccount();
            admin.setUsername(username);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setRole(Role.ADMIN);
            admin.setLocation(location);
            admin.setTwoFactorEnabled(false);
            userAccountRepository.save(admin);
        }
    }

    private void ensureUser(String username, String password, Role role, Location location, Patient patient, Doctor doctor) {
        if (userAccountRepository.existsByUsernameIgnoreCase(username)) {
            return;
        }
        UserAccount ua = new UserAccount();
        ua.setUsername(username);
        ua.setPassword(passwordEncoder.encode(password));
        ua.setRole(role);
        ua.setLocation(location);
        ua.setPatient(patient);
        ua.setDoctor(doctor);
        ua.setTwoFactorEnabled(false);
        userAccountRepository.save(ua);
    }

    private Department ensureDepartment(String name, Double fee) {
        return departmentRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> {
                    Department department = new Department();
                    department.setName(name);
                    department.setConsultationFee(fee);
                    return departmentRepository.save(department);
                });
    }

    private Doctor ensureDoctor(String name, String contact, String specialization, Department department) {
        return doctorRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> {
                    Doctor doctor = new Doctor();
                    doctor.setName(name);
                    doctor.setContact(contact);
                    doctor.setSpecialization(specialization);
                    doctor.setDepartment(department);
                    return doctorRepository.save(doctor);
                });
    }

    private Patient ensurePatient(String fullName, int age, String gender, String email, String phone, Location location, Set<Doctor> doctors) {
        return patientRepository.findByEmail(email)
                .orElseGet(() -> {
                    Patient patient = new Patient();
                    patient.setFullName(fullName);
                    patient.setAge(age);
                    patient.setGender(gender);
                    patient.setEmail(email);
                    patient.setPhone(phone);
                    patient.setLocation(location);
                    patient.getDoctors().addAll(doctors);
                    return patientRepository.save(patient);
                });
    }
}
