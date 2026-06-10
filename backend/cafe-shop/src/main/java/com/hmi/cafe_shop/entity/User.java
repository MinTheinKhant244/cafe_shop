package com.hmi.cafe_shop.entity;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	private String name;
	private String email;
	
	@JsonIgnore
	private String password;
	private String role;
	
	@Column(name = "is_active")
	private Boolean isActive;
	
	@Column(name = "created_at", updatable = false)
	private LocalDateTime createdAt;
	
	@Column(name = "last_login")
	private LocalDateTime lastLogin;

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;
	
	@OneToMany(mappedBy = "createdBy")
	@JsonIgnore 
	private List<Order> orders;
	
	@OneToMany(mappedBy = "createdBy")
	@JsonIgnore
	private List<PurchaseOrder> purchaseOrdersCreated;
	
	@Column(name = "reset_token")
    private String resetToken;
    
    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry;

	@PrePersist
	protected void onCreate() {
		this.isActive = true;
		this.createdAt = LocalDateTime.now();
	}
}