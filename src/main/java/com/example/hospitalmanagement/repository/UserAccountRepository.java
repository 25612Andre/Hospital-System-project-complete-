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

    @Query("SELECT DISTINCT u FROM UserAccount u LEFT JOIN u.patient p LEFT JOIN u.doctor d WHERE " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "COALESCE(LOWER(p.fullName), '') LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "COALESCE(LOWER(p.email), '') LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "COALESCE(LOWER(p.phone), '') LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "COALESCE(LOWER(d.name), '') LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "COALESCE(LOWER(d.contact), '') LIKE LOWER(CONCAT('%', :term, '%'))")
    Page<UserAccount> searchFull(@Param("term") String term, Pageable pageable);

    @Query("SELECT DISTINCT u FROM UserAccount u LEFT JOIN u.patient p LEFT JOIN u.doctor d WHERE " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "COALESCE(LOWER(p.fullName), '') LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "COALESCE(LOWER(p.email), '') LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "COALESCE(LOWER(p.phone), '') LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "COALESCE(LOWER(d.name), '') LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "COALESCE(LOWER(d.contact), '') LIKE LOWER(CONCAT('%', :term, '%'))) AND " +
           "u.role = :role")
    Page<UserAccount> searchFullWithRole(@Param("term") String term, @Param("role") Role role, Pageable pageable);

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
