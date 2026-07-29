import mongoose from 'mongoose';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { Transport, AuditLog } from '../models';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const createBus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { plateNumber, busNumber, capacity, driverName, driverPhone, driverLicense, routeName, routeStops, fee, status, notes } = req.body;

    if (!plateNumber || !busNumber || !capacity || !driverName || !routeName || fee === undefined) {
      throw new ApiError(400, 'Missing required fields');
    }

    const existing = await Transport.findOne({ $or: [{ plateNumber: plateNumber.toUpperCase() }, { busNumber }] });
    if (existing) {
      throw new ApiError(400, 'Bus with this plate number or bus number already exists');
    }

    const bus = await Transport.create({
      plateNumber: plateNumber.toUpperCase(),
      busNumber,
      capacity,
      driverName,
      driverPhone,
      driverLicense,
      routeName,
      routeStops: routeStops || [],
      fee,
      status: status || 'Active',
      notes,
    });

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TRANSPORT_CREATE',
      description: `Bus "${bus.busNumber}" (${bus.plateNumber}) created`,
      ipAddress: req.ip,
      metadata: {
        busId: bus._id,
        plateNumber: bus.plateNumber,
        busNumber: bus.busNumber,
        createdBy: req.user.userId,
      },
    });

    logger.info('Bus created', {
      busId: bus._id,
      plateNumber: bus.plateNumber,
      createdBy: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Bus created successfully',
      data: bus,
    });
  } catch (error) {
    next(error);
  }
};

export const listBuses = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;

    const filter: any = {};

    if (search) {
      filter.$or = [
        { plateNumber: { $regex: search, $options: 'i' } },
        { busNumber: { $regex: search, $options: 'i' } },
        { driverName: { $regex: search, $options: 'i' } },
        { routeName: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [buses, total] = await Promise.all([
      Transport.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Transport.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        buses,
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

export const getBusById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const bus = await Transport.findById(id);
    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }

    res.json({
      success: true,
      data: bus,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;
    const { plateNumber, busNumber, capacity, driverName, driverPhone, driverLicense, routeName, routeStops, fee, status, notes } = req.body;

    const bus = await Transport.findById(id);
    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }

    const oldBus = { ...bus.toObject() };

    if (plateNumber !== undefined) bus.plateNumber = plateNumber.toUpperCase();
    if (busNumber !== undefined) bus.busNumber = busNumber;
    if (capacity !== undefined) bus.capacity = capacity;
    if (driverName !== undefined) bus.driverName = driverName;
    if (driverPhone !== undefined) bus.driverPhone = driverPhone;
    if (driverLicense !== undefined) bus.driverLicense = driverLicense;
    if (routeName !== undefined) bus.routeName = routeName;
    if (routeStops !== undefined) bus.routeStops = routeStops;
    if (fee !== undefined) bus.fee = fee;
    if (status !== undefined) bus.status = status;
    if (notes !== undefined) bus.notes = notes;

    await bus.save();

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TRANSPORT_UPDATE',
      description: `Bus "${bus.busNumber}" (${bus.plateNumber}) updated`,
      ipAddress: req.ip,
      metadata: {
        busId: bus._id,
        oldPlateNumber: oldBus.plateNumber,
        newPlateNumber: bus.plateNumber,
        oldStatus: oldBus.status,
        newStatus: bus.status,
        updatedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Bus updated successfully',
      data: bus,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated');
    }

    const { id } = req.params;

    const bus = await Transport.findById(id);
    if (!bus) {
      throw new ApiError(404, 'Bus not found');
    }

    if (bus.status === 'Active') {
      throw new ApiError(400, 'Cannot delete a bus with Active status. Set it to Inactive first.');
    }

    await Transport.findByIdAndDelete(id);

    await AuditLog.create({
      userId: req.user.id,
      activityType: 'TRANSPORT_DELETE',
      description: `Bus "${bus.busNumber}" (${bus.plateNumber}) deleted`,
      ipAddress: req.ip,
      metadata: {
        busId: bus._id,
        plateNumber: bus.plateNumber,
        busNumber: bus.busNumber,
        deletedBy: req.user.userId,
      },
    });

    res.json({
      success: true,
      message: 'Bus deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getTransportReport = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [totalBuses, activeBuses, maintenanceBuses, inactiveBuses] = await Promise.all([
      Transport.countDocuments(),
      Transport.countDocuments({ status: 'Active' }),
      Transport.countDocuments({ status: 'Maintenance' }),
      Transport.countDocuments({ status: 'Inactive' }),
    ]);

    res.json({
      success: true,
      data: {
        totalBuses,
        activeBuses,
        maintenanceBuses,
        inactiveBuses,
        utilizationRate: totalBuses > 0 ? Math.round((activeBuses / totalBuses) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
