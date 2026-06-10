package com.hmi.cafe_shop.serviceImpl;

import com.hmi.cafe_shop.entity.TableEntity;
import com.hmi.cafe_shop.repository.TableRepository;
import com.hmi.cafe_shop.service.TableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class TableServiceImpl implements TableService {

    @Autowired
    private TableRepository tableRepository;

    @Override
    public TableEntity createTable(TableEntity table) {
    	if (tableRepository.existsByTableNo(table.getTableNo())) {
            throw new RuntimeException("Table number " + table.getTableNo() + " already exists!");
        }
        return tableRepository.save(table);
    }

    @Override
    public Optional<TableEntity> getTableById(Long id) {
        return tableRepository.findById(id);
    }

    @Override
    public List<TableEntity> getAllTables() {
        return tableRepository.findAll();
    }

    @Override
    public List<TableEntity> getTablesByStatus(String status) {
        return tableRepository.findByStatus(status);
    }

    @Override
    public TableEntity updateTableStatus(Long id, String status) {
        return tableRepository.findById(id).map(table -> {
            table.setStatus(status);
            return tableRepository.save(table);
        }).orElseThrow(() -> new RuntimeException("Table not found"));
    }

    @Override
    public void deleteTable(Long id) {
        tableRepository.deleteById(id);
    }
    
    @Override
    public TableEntity setTableAsMaster(Long id) {
        TableEntity table = tableRepository.findById(id).orElseThrow(() -> new RuntimeException("Table not found"));
        table.setMaster(true);
        return tableRepository.save(table);
    }
    
    @Override
    @Transactional
    public void mergeTables(Long masterTableId, Long subTableId) {
        TableEntity master = tableRepository.findById(masterTableId)
                .orElseThrow(() -> new RuntimeException("Master table not found"));
        TableEntity sub = tableRepository.findById(subTableId)
                .orElseThrow(() -> new RuntimeException("Sub table not found"));

        // Master Table ကို သတ်မှတ်ခြင်း
        master.setMaster(true);
        tableRepository.save(master);

        // Sub Table ကို Master အောက်သို့ ရွှေ့ခြင်း
        sub.setParentTableId(masterTableId);
        sub.setStatus("OCCUPIED"); // ပေါင်းလိုက်လျှင် အလိုအလျောက် Occupied ဖြစ်သွားမည်
        tableRepository.save(sub);
    }

    @Override
    @Transactional
    public void unmergeTable(Long subTableId) {
        TableEntity sub = tableRepository.findById(subTableId)
                .orElseThrow(() -> new RuntimeException("Table not found"));

        // Parent ID ကို သိမ်းထားပါ (နောက်မှ Master ကို စစ်ဖို့အတွက်)
        Long masterId = sub.getParentTableId();
        
        if (masterId == null) {
            throw new RuntimeException("This table is not merged!");
        }

        // Sub Table ကို ပြန်ခွဲထုတ်ခြင်း
        sub.setParentTableId(null);
        sub.setStatus("AVAILABLE");
        tableRepository.save(sub);

        // Master table ထဲတွင် sub table များ မကျန်တော့လျှင် isMaster ကို false ပြန်လုပ်ခြင်း
        long remainingSubs = tableRepository.countByParentTableId(masterId);
        if (remainingSubs == 0) {
            TableEntity master = tableRepository.findById(masterId).orElse(null);
            if (master != null) {
                master.setMaster(false);
                tableRepository.save(master);
            }
        }
    }
    
}