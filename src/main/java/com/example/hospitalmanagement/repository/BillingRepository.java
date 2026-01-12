package com.example.hospitalmanagement.repository;

import com.example.hospitalmanagement.model.Bill;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BillingRepository extends JpaRepository<Bill, Long> {

    Page<Bill> findByStatusContainingIgnoreCaseOrAppointment_Patient_FullNameContainingIgnoreCase(
            String status,
            String patient,
            Pageable pageable);

    List<Bill> findByAppointment_Id(Long appointmentId);

    @Query("select coalesce(sum(b.amount), 0) from Bill b where lower(b.status) = lower(:status)")
    double sumAmountByStatus(@Param("status") String status);
    
    @Query("select b from Bill b where (lower(b.status) like lower(concat('%', :term, '%')) or lower(b.appointment.patient.fullName) like lower(concat('%', :term, '%'))) and b.appointment.patient.id = :patientId")
    Page<Bill> searchByTermAndPatient(@Param("term") String term, @Param("patientId") Long patientId, Pageable pageable);
    
    Page<Bill> findByAppointment_Patient_Id(Long patientId, Pageable pageable);
    Page<Bill> findByAppointment_Doctor_Id(Long doctorId, Pageable pageable);

    @Query("select coalesce(sum(b.amount), 0) from Bill b where lower(b.status) = lower(:status) and b.appointment.doctor.id = :doctorId")
    double sumAmountByStatusAndDoctorId(@Param("status") String status, @Param("doctorId") Long doctorId);

    long countByAppointment_Doctor_Id(Long doctorId);
    long countByAppointment_Patient_Id(Long patientId);

    @Query("select coalesce(sum(b.amount), 0) from Bill b where lower(b.status) = lower(:status) and b.appointment.patient.id = :patientId")
    double sumAmountByStatusAndPatientId(@Param("status") String status, @Param("patientId") Long patientId);

    @Query("select coalesce(sum(b.amount), 0) from Bill b where b.appointment.doctor.id = :doctorId")
    double sumTotalAmountByDoctorId(@Param("doctorId") Long doctorId);

    @Query("select coalesce(sum(b.amount), 0) from Bill b where b.appointment.patient.id = :patientId")
    double sumTotalAmountByPatientId(@Param("patientId") Long patientId);
}
