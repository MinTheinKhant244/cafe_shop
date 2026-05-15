package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.StockLog;
import com.hmi.cafe_shop.entity.Inventory;
import com.hmi.cafe_shop.repository.StockLogRepository;
import com.hmi.cafe_shop.repository.ProductRepository;
import com.hmi.cafe_shop.repository.InventoryRepository;
import com.hmi.cafe_shop.service.StockLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockLogServiceImpl implements StockLogService {

    private final StockLogRepository stockLogRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository; // Inventory အတွက် ထပ်တိုးခြင်း

    @Override
    @Transactional
    public StockLog logStockChange(StockLog log) {
        if (log.getProduct() != null && log.getProduct().getId() != null) {
            productRepository.findById(log.getProduct().getId())
                    .ifPresent(log::setProduct);
        }
        
        StockLog savedLog = stockLogRepository.save(log);

        Inventory inventory = inventoryRepository.findByProductId(log.getProduct().getId())
                .orElseGet(() -> {
                    Inventory newInv = new Inventory();
                    newInv.setProduct(log.getProduct());
                    newInv.setQuantity(0);
                    return newInv;
                });

        inventory.setQuantity(inventory.getQuantity() + log.getQuantity());
        inventoryRepository.save(inventory);

        return savedLog;
    }

    @Override
    public List<StockLog> getLogsByProduct(Long productId) {
        return stockLogRepository.findByProductIdOrderByLoggedAtDesc(productId);
    }

    @Override
    public List<StockLog> getAllLogs() {
        return stockLogRepository.findAll();
    }
    
//    @Override
//    public List<StockLog> getExpiringProducts(int daysNotice) {
//        LocalDate today = LocalDate.now();
//        LocalDate targetDate = today.plusDays(daysNotice);
//        return stockLogRepository.findExpiringStocks(today, targetDate);
//    }

    @Override
    @Transactional
    public void writeOffExpiredStock(Long stockLogId, String remarks) {
        StockLog expiredStock = stockLogRepository.findById(stockLogId)
                .orElseThrow(() -> new RuntimeException("Stock log not found with id: " + stockLogId));

        if (expiredStock.getQuantity() > 0) {
            // ၁။ သက်တမ်းကုန်သွားသော ပမာဏအတိုင်း နှုတ်ပစ်ရန် DAMAGE Log အသစ်တစ်ခု ဆောက်ခြင်း
            StockLog damageLog = new StockLog();
            damageLog.setProduct(expiredStock.getProduct());
            damageLog.setQuantity(-expiredStock.getQuantity()); // အနှုတ်ပြောင်းလဲခြင်း
            damageLog.setReferenceType("DAMAGE");
            damageLog.setUnitCost(expiredStock.getUnitCost());
            damageLog.setReferenceId(expiredStock.getId());
            damageLog.setRemarks(remarks);
            
            stockLogRepository.save(damageLog);

            inventoryRepository.findByProductId(expiredStock.getProduct().getId())
                    .ifPresent(inv -> {
                        inv.setQuantity(inv.getQuantity() - expiredStock.getQuantity());
                        inventoryRepository.save(inv);
                    });

            expiredStock.setQuantity(0);
            stockLogRepository.save(expiredStock);
        }
    }
}