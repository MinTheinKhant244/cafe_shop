package com.hmi.cafe_shop.service;

import com.hmi.cafe_shop.entity.Category;
import java.util.List;
import java.util.Optional;

public interface CategoryService {
    Category createCategory(Category category);
    Optional<Category> getCategoryById(Long id);
    List<Category> getAllCategories();
    List<Category> getActiveCategories();
    Category updateCategory(Category category, Long id);
    void deleteCategory(Long id);
}