package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.dto.StockTransactionRequest;
import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.entity.InventoryTransaction;
import com.hmi.cafe_shop.enums.TransactionType;
import com.hmi.cafe_shop.repository.InventoryRepository;
import com.hmi.cafe_shop.repository.InventoryTransactionRepository;
import com.hmi.cafe_shop.service.InventoryTransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryTransactionServiceImpl implements InventoryTransactionService {

    private final InventoryTransactionRepository transactionRepository;
    private final InventoryRepository inventoryRepository;

    @Override
    @Transactional
    public InventoryTransaction stockIn(StockTransactionRequest request) {
        return processTransaction(request, TransactionType.STOCK_IN);
    }

    @Override
    @Transactional
    public InventoryTransaction stockOut(StockTransactionRequest request) {
        return processTransaction(request, TransactionType.STOCK_OUT);
    }

    @Override
    @Transactional
    public InventoryTransaction adjustStock(StockTransactionRequest request) {
        return processTransaction(request, TransactionType.ADJUSTMENT);
    }

    @Override
    public List<InventoryTransaction> getTransactionsByInventory(Long inventoryId) {
        return transactionRepository.findByInventoryIdOrderByTransactionDateDesc(inventoryId);
    }

    @Override
    public List<InventoryTransaction> getTransactionsByDateRange(LocalDateTime start, LocalDateTime end) {
        return transactionRepository.findByTransactionDateBetweenOrderByTransactionDateDesc(start, end);
    }

    @Transactional
    protected InventoryTransaction processTransaction(StockTransactionRequest request, TransactionType type) {
        Inventory inventory = inventoryRepository.findById(request.getInventoryId())
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        Double beforeQty = inventory.getQuantity();
        Double changeQty = request.getQuantity();
        Double afterQty;

        switch (type) {
            case STOCK_IN:
                afterQty = beforeQty + changeQty;
                break;
            case STOCK_OUT:
                if (beforeQty < changeQty) {
                    throw new RuntimeException("Insufficient stock! Available: " + beforeQty);
                }
                afterQty = beforeQty - changeQty;
                changeQty = -changeQty;
                break;
            case ADJUSTMENT:
                afterQty = changeQty;
                changeQty = changeQty - beforeQty;
                break;
            default:
                afterQty = beforeQty;
        }

        inventory.setQuantity(afterQty);
        inventoryRepository.save(inventory);

        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setInventory(inventory);
        transaction.setTransactionType(type.name());
        transaction.setQuantity(changeQty);
        transaction.setUnitPrice(request.getUnitPrice() != null ? request.getUnitPrice() : inventory.getCurrentPrice());
        transaction.setBeforeQuantity(beforeQty);
        transaction.setAfterQuantity(afterQty);
        transaction.setReferenceNo(request.getReferenceNo());
        transaction.setRemark(request.getRemark());
        transaction.setCreatedBy(getCurrentUser());
        transaction.setTransactionDate(LocalDateTime.now());

        return transactionRepository.save(transaction);
    }

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }
}