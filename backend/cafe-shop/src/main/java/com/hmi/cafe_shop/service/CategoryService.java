package com.hmi.cafe_shop.service;

import java.util.List;
import com.hmi.cafe_shop.entity.Category;

public interface CategoryService {
    Category createCategory(Category category);
    Category updateCategory(Category category, Long id);
    void activateCategory(Long id);
    void deactivateCategory(Long id);
    List<Category> getAllCategories();
    List<Category> getActiveCategories();
}