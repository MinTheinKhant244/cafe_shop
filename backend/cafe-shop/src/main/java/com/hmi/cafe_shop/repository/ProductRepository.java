package com.hmi.cafe_shop.repository;

import com.hmi.cafe_shop.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategoryId(Long categoryId);

    List<Product> findByIsActiveTrue();

    List<Product> findByNameContainingIgnoreCase(String keyword);
}