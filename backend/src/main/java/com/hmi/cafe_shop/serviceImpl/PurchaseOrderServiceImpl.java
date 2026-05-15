package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.PurchaseOrder;
import com.hmi.cafe_shop.repository.PurchaseOrderRepository;
import com.hmi.cafe_shop.repository.SupplierRepository;
import com.hmi.cafe_shop.repository.UserRepository;
import com.hmi.cafe_shop.service.PurchaseOrderService;
import com.hmi.cafe_shop.util.InvoiceGenerator; // အချိန်ယူတဲ့ format အတိုင်း သုံးနိုင်ပါသည်

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository poRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;

    @Override
    public PurchaseOrder createPO(PurchaseOrder po) {
        // PO Number Auto Generate
        String rawNo = InvoiceGenerator.generateInvoiceNo();
        po.setPoNo(rawNo.replace("INV-", "PO-")); 
        if (po.getSupplier() != null && po.getSupplier().getId() != null) {
            supplierRepository.findById(po.getSupplier().getId())
                    .ifPresent(po::setSupplier);
        }
        if (po.getCreatedBy() != null && po.getCreatedBy().getId() != null) {
            userRepository.findById(po.getCreatedBy().getId())
                    .ifPresent(po::setCreatedBy);
        }

        return poRepository.save(po);
    }

    @Override
    public Optional<PurchaseOrder> getPOById(Long id) {
        return poRepository.findById(id);
    }

    @Override
    public Optional<PurchaseOrder> getPOByNo(String poNo) {
        return poRepository.findByPoNo(poNo);
    }

    @Override
    public List<PurchaseOrder> getAllPOs() {
        return poRepository.findAll();
    }

    @Override
    public PurchaseOrder updatePOStatus(Long id, String status) {
        return poRepository.findById(id).map(po -> {
            po.setStatus(status);
            return poRepository.save(po);
        }).orElseThrow(() -> new RuntimeException("Purchase Order not found"));
    }
}