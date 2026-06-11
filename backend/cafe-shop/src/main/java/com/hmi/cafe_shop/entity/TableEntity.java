package com.hmi.cafe_shop.entity;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "shop_tables")
public class TableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "table_no", unique = true, nullable = false)
    private String tableNo;
    
    @Column(name = "parent_table_id")
    private Long parentTableId;
    
    @Column(name = "is_master")
    @JsonProperty("isMaster")
    private boolean isMaster = false; 

    @Column(name = "status")
    private String status;
    
    @Transient
    private List<TableEntity> subTables;
    
    @OneToMany(mappedBy = "table")
    @JsonIgnore
    private List<Order> orders;
    
    @PrePersist
    protected void onCreate() {
        this.status = "AVAILABLE";
        this.isMaster = false;
        this.parentTableId = null;
    }
    
}