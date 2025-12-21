package com.example.hospitalmanagement.repository;

import com.example.hospitalmanagement.model.Location;
import com.example.hospitalmanagement.model.enums.LocationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Location entity following pharmacy-management pattern.
 * Extends JpaSpecificationExecutor for dynamic filtering by any column.
 */
public interface LocationRepository extends JpaRepository<Location, Long>, JpaSpecificationExecutor<Location> {

    boolean existsByCode(String code);

    Optional<Location> findByCode(String code);

    Optional<Location> findByCodeIgnoreCase(String code);

    List<Location> findByParentId(Long parentId);

    Page<Location> findByParentId(Long parentId, Pageable pageable);

    Page<Location> findByParentIdAndType(Long parentId, LocationType type, Pageable pageable);

    List<Location> findByType(LocationType type);

    Page<Location> findByType(LocationType type, Pageable pageable);

    Page<Location> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Location> findByNameContainingIgnoreCaseAndType(String name, LocationType type, Pageable pageable);

    Page<Location> findByNameContainingIgnoreCaseAndParentIdAndType(String name, Long parentId, LocationType type, Pageable pageable);

    Page<Location> findByNameContainingIgnoreCaseAndParentId(String name, Long parentId, Pageable pageable);

    Page<Location> findAllByOrderByNameAsc(Pageable pageable);
    
    List<Location> findByParent_Id(Long parentId);
    
    Optional<Location> findByTypeAndCodeIgnoreCase(LocationType type, String code);
    
    Optional<Location> findByTypeAndNameIgnoreCase(LocationType type, String name);
    
    boolean existsByTypeAndNameIgnoreCase(LocationType type, String name);
    
    // For SearchService global search
    Page<Location> findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(String name, String code, Pageable pageable);
}
