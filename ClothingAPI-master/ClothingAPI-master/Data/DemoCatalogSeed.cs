using ClothingAPI.Enums;
using ClothingAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ClothingAPI.Data;

// Chỉ bật ở cấu hình demo cục bộ; không thay đổi dữ liệu cửa hàng đã có.
public static class DemoCatalogSeed
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.Products.AnyAsync()) return;
        var category = await db.Categories.FirstOrDefaultAsync(x => x.Slug == "ao-thun")
            ?? new Category { CategoryName = "Áo thun", Slug = "ao-thun" };
        var color = await db.Colors.FirstOrDefaultAsync(x => x.ColorName == "Đen")
            ?? new Color { ColorName = "Đen", ColorCode = "#111111" };
        var size = await db.Sizes.FirstOrDefaultAsync(x => x.SizeName == "M")
            ?? new Size { SizeName = "M", DisplayOrder = 2 };
        var names = new[] { "Áo thun basic", "Áo thun cotton", "Áo phông unisex", "Áo thun trẻ trung", "Áo thun thể thao", "Áo thun tối giản" };
        var images = new[] { "ao-thun-basic.webp", "ao-thun.webp", "ao-phong.webp", "ao1.webp", "ao2.webp", "ao3.webp" };
        for (var i = 0; i < names.Length; i++)
        {
            var product = new Product
            {
                Category = category, ProductName = names[i], Slug = $"demo-ao-thun-{i + 1}",
                Description = "Sản phẩm mẫu phục vụ kiểm thử Clothing Store – Nhóm 16.",
                ShortDescription = "Áo thun cotton thoải mái, dễ phối đồ.", Material = "Cotton",
                Gender = Gender.Unisex, BasePrice = 150000 + i * 20000, IsFeatured = true
            };
            product.ProductVariants.Add(new ProductVariant
            {
                Color = color, Size = size, SKU = $"DEMO-{i + 1}-DEN-M",
                StockQuantity = i == 0 ? 1 : 20, AverageCostPrice = 80000
            });
            product.ProductImages.Add(new ProductImage
            {
                ImageUrl = $"/assets/images/product/{images[i]}", IsThumbnail = true
            });
            db.Products.Add(product);
        }
        await db.SaveChangesAsync();
    }
}
