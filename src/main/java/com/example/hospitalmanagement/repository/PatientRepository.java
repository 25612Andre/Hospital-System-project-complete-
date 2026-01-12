package com.example.hospitalmanagement.repository;

import com.example.hospitalmanagement.model.Patient;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByPhone(String phone);
    
    java.util.Optional<Patient> findByEmail(String email);

    List<Patient> findByLocation_IdIn(List<Long> locationIds);

    long countByLocation_Id(Long locationId);

    Page<Patient> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContainingIgnoreCase(
            String fullName, String email, String phone, Pageable pageable);

    @Query("""
            select p from Patient p
            where (:name is null or lower(p.fullName) like lower(concat('%', :name, '%')))
              and (:email is null or lower(p.email) like lower(concat('%', :email, '%')))
              and (:phone is null or lower(p.phone) like lower(concat('%', :phone, '%')))
              and (:gender is null or lower(p.gender) = lower(:gender))
            """)
    Page<Patient> filterPatients(@Param("name") String name,
                                 @Param("email") String email,
                                 @Param("phone") String phone,
                                 @Param("gender") String gender,
                                 Pageable pageable);

    @Query("""
            select p from Patient p
            join p.doctors d
            where d.id = :doctorId
              and (:name is null or lower(p.fullName) like lower(concat('%', :name, '%')))
              and (:email is null or lower(p.email) like lower(concat('%', :email, '%')))
              and (:phone is null or lower(p.phone) like lower(concat('%', :phone, '%')))
              and (:gender is null or lower(p.gender) = lower(:gender))
            """)
    Page<Patient> filterPatientsForDoctor(@Param("doctorId") Long doctorId,
                                          @Param("name") String name,
                                          @Param("email") String email,
                                          @Param("phone") String phone,
                                          @Param("gender") String gender,
                                          Pageable pageable);

    @Query("""
            select p from Patient p
            join p.doctors d
            where d.id = :doctorId
              and (
                lower(p.fullName) like lower(concat('%', :term, '%'))
                or lower(p.email) like lower(concat('%', :term, '%'))
                or lower(p.phone) like lower(concat('%', :term, '%'))
              )
            """)
    Page<Patient> searchForDoctor(@Param("doctorId") Long doctorId,
                                  @Param("term") String term,
                                  Pageable pageable);
    
    long countByDoctors_Id(Long doctorId);
    
    Page<Patient> findByDoctors_Id(Long doctorId, Pageable pageable);
    
    List<Patient> findByDoctors_Id(Long doctorId);
}
