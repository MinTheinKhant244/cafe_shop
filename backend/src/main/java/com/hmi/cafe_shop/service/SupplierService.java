package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Supplier;
import java.util.List;
import java.util.Optional;

public interface SupplierService {
    Supplier createSupplier(Supplier supplier);
    Optional<Supplier> getSupplierById(Long id);
    List<Supplier> getAllSuppliers();
    List<Supplier> getActiveSuppliers();
    Supplier updateSupplier(Supplier supplier, Long id);
    void deleteSupplier(Long id);
}