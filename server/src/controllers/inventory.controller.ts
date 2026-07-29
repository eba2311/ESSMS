import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { InventoryItem, Counter, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const createItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { name, category, description, quantity, unit, condition, location, purchaseDate, purchasePrice, supplier, notes } = req.body;

    if (!name || !category || !quantity) {
      throw new ApiError(400, 'Missing required fields');
    }

    const itemCode = await Counter.getNextSequence('INV');

    const item = await InventoryItem.create({
      itemCode,
      name: name.trim(),
      category,
      description: description?.trim(),
      quantity,
      availableQuantity: quantity,
      unit: unit?.trim(),
      condition: condition || 'New',
      location: location?.trim(),
      purchaseDate,
      purchasePrice,
      supplier: supplier?.trim(),
      notes: notes?.trim(),
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'INVENTORY_CREATE',
      description: `Inventory item "${name}" created`,
      ipAddress: req.ip,
      metadata: {
        itemId: item._id,
        itemCode: item.itemCode,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        createdBy: req.user.userId,
      },
    });

    logger.info(`Inventory item created`, {
      itemId: item._id,
      itemCode: item.itemCode,
      name: item.name,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const listItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20, search, category, condition } = req.query;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (condition) {
      filter.condition = condition;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      InventoryItem.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      InventoryItem.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await InventoryItem.findById(id);
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { name, category, description, quantity, unit, condition, location, purchaseDate, purchasePrice, supplier, notes } = req.body;

    const item = await InventoryItem.findById(id);
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    if (name !== undefined) item.name = name.trim();
    if (category !== undefined) item.category = category;
    if (description !== undefined) item.description = description?.trim();
    if (unit !== undefined) item.unit = unit?.trim();
    if (condition !== undefined) item.condition = condition;
    if (location !== undefined) item.location = location?.trim();
    if (purchaseDate !== undefined) item.purchaseDate = purchaseDate;
    if (purchasePrice !== undefined) item.purchasePrice = purchasePrice;
    if (supplier !== undefined) item.supplier = supplier?.trim();
    if (notes !== undefined) item.notes = notes?.trim();

    if (quantity !== undefined) {
      if (quantity < 0) {
        throw new ApiError(400, 'Quantity must be non-negative');
      }
      const diff = quantity - item.quantity;
      item.quantity = quantity;
      item.availableQuantity += diff;
      if (item.availableQuantity < 0) {
        item.availableQuantity = 0;
      }
    }

    await item.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'INVENTORY_UPDATE',
      description: `Inventory item "${item.name}" updated`,
      ipAddress: req.ip,
      metadata: {
        itemId: item._id,
        itemCode: item.itemCode,
        updatedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const item = await InventoryItem.findById(id);
    if (!item) {
      throw new ApiError(404, 'Inventory item not found');
    }

    await InventoryItem.findByIdAndDelete(id);

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'INVENTORY_DELETE',
      description: `Inventory item "${item.name}" deleted`,
      ipAddress: req.ip,
      metadata: {
        itemId: item._id,
        itemCode: item.itemCode,
        name: item.name,
        deletedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const totalItems = await InventoryItem.countDocuments();
    const totalQuantity = await InventoryItem.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    const totalAvailable = await InventoryItem.aggregate([
      { $group: { _id: null, total: { $sum: '$availableQuantity' } } },
    ]);
    const totalValue = await InventoryItem.aggregate([
      { $match: { purchasePrice: { $exists: true, $ne: null } } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', '$purchasePrice'] } } } },
    ]);

    const categoryStats = await InventoryItem.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          availableQuantity: { $sum: '$availableQuantity' },
          totalValue: { $sum: { $multiply: ['$quantity', { $ifNull: ['$purchasePrice', 0] }] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const conditionStats = await InventoryItem.aggregate([
      {
        $group: {
          _id: '$condition',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalItems,
          totalQuantity: totalQuantity[0]?.total || 0,
          availableQuantity: totalAvailable[0]?.total || 0,
          totalValue: totalValue[0]?.total || 0,
        },
        categoryBreakdown: categoryStats,
        conditionBreakdown: conditionStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
