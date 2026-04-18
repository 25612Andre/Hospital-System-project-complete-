package com.example.hospitalmanagement.repository;

import com.example.hospitalmanagement.model.Location;
import com.example.hospitalmanagement.model.enums.LocationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
    
    Optional<Location> findByNameIgnoreCase(String name);

    List<Location> findByParentId(Long parentId);

    Page<Location> findByParentId(Long parentId, Pageable pageable);

    Page<Location> findByParentIdAndType(Long parentId, LocationType type, Pageable pageable);

    List<Location> findByType(LocationType type);

    Page<Location> findByType(LocationType type, Pageable pageable);

    long countByType(LocationType type);

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

    /**
     * Resolve the full name-path for a location (root -> ... -> leaf) in a single query.
     */
    @Query(value = """
            WITH RECURSIVE ancestors AS (
                SELECT id, name, parent_id, 1 AS depth
                FROM locations
                WHERE id = :id
                UNION ALL
                SELECT l.id, l.name, l.parent_id, a.depth + 1
                FROM locations l
                JOIN ancestors a ON a.parent_id = l.id
            )
            SELECT name
            FROM ancestors
            ORDER BY depth DESC
            """, nativeQuery = true)
    List<String> findPathNames(@Param("id") Long id);
}
