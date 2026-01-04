package com.example.hospitalmanagement.repository;

import com.example.hospitalmanagement.model.UserAccount;
import com.example.hospitalmanagement.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByUsernameIgnoreCase(String username);
    
    // Alias for audit logging
    default Optional<UserAccount> findByUsername(String username) {
        return findByUsernameIgnoreCase(username);
    }

    Page<UserAccount> findByUsernameContainingIgnoreCaseOrPatient_FullNameContainingIgnoreCase(
            String username, String fullName, Pageable pageable);

    Page<UserAccount> findByUsernameContainingIgnoreCaseOrPatient_FullNameContainingIgnoreCaseOrRole(
            String username, String fullName, Role role, Pageable pageable);

    List<UserAccount> findByLocation_IdIn(List<Long> locationIds);

    long countByLocation_Id(Long locationId);

    boolean existsByUsernameIgnoreCase(String username);
    
    boolean existsByDoctor_Id(Long doctorId);
    
    List<UserAccount> findByDoctor_Id(Long doctorId);
    
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from UserAccount u where u.patient.id = :patientId")
    void deleteByPatientId(@Param("patientId") Long patientId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from UserAccount u where u.doctor.id = :doctorId")
    void deleteByDoctorId(@Param("doctorId") Long doctorId);

    Optional<UserAccount> findByPatient_Id(Long patientId);
}
