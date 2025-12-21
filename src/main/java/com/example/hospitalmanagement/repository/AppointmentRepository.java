package com.example.hospitalmanagement.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.hospitalmanagement.model.Appointment;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @org.springframework.data.jpa.repository.Query("SELECT a FROM Appointment a LEFT JOIN Bill b ON b.appointment = a WHERE b.id IS NULL")
    List<Appointment> findAllUnbilled();

    // Fetch by related entity id to avoid name collisions
    List<Appointment> findByDoctor_Id(Long doctorId);
    Page<Appointment> findByDoctor_Id(Long doctorId, Pageable pageable);

    List<Appointment> findByPatient_Id(Long patientId);
    Page<Appointment> findByPatient_Id(Long patientId, Pageable pageable);

    Page<Appointment> findByDoctor_NameContainingIgnoreCaseOrPatient_FullNameContainingIgnoreCase(
            String doctorName,
            String patientName,
            Pageable pageable);

    long countByStatusIgnoreCase(String status);

    long countByAppointmentDateBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

    // Doctor specific counts
    @org.springframework.data.jpa.repository.Query("select count(distinct a.patient.id) from Appointment a where a.doctor.id = :doctorId")
    long countDistinctPatientByDoctor_Id(@org.springframework.data.repository.query.Param("doctorId") Long doctorId);

    long countByDoctor_Id(Long doctorId);
    long countByDoctor_IdAndStatusIgnoreCase(Long doctorId, String status);
    long countByDoctor_IdAndAppointmentDateBetween(Long doctorId, java.time.LocalDateTime start, java.time.LocalDateTime end);

    // Patient specific counts
    long countByPatient_Id(Long patientId);
    long countByPatient_IdAndStatusIgnoreCase(Long patientId, String status);
    long countByPatient_IdAndAppointmentDateBetween(Long patientId, java.time.LocalDateTime start, java.time.LocalDateTime end);
}
