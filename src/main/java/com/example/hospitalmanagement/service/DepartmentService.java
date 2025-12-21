package com.example.hospitalmanagement.service;

import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.hospitalmanagement.model.Department;
import com.example.hospitalmanagement.repository.DepartmentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository repository;

    public List<Department> getAll() {
        return repository.findAll();
    }

    public Page<Department> getPage(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public boolean existsByName(@NonNull String name) {
        return repository.existsByNameIgnoreCase(name);
    }

    public Department getById(@NonNull Long id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Department not found"));
    }

    public Department save(@NonNull Department department) {
        return repository.save(department);
    }

    public Department update(@NonNull Long id, @NonNull Department updated) {
        Department existing = getById(id);
        existing.setName(updated.getName());
        existing.setConsultationFee(updated.getConsultationFee());
        return repository.save(existing);
    }

    public void delete(@NonNull Long id) {
        repository.deleteById(id);
    }
}
