import PriceRule from '../models/PriceRule.js';
import Route from '../models/Route.js';
import BusType from '../models/BusType.js';
import { Op } from 'sequelize';

export const getAllPriceRules = async (req, res) => {
  try {
    const rules = await PriceRule.findAll({
      include: [
        { model: Route, as: 'route', required: false },
        { model: BusType, as: 'busType', required: false },
      ],
      order: [['priority', 'DESC']],
    });
    return res.status(200).json(rules);
  } catch (error) {
    console.error('Lỗi lấy luật giá:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const getActivePriceRules = async (req, res) => {
  try {
    const now = new Date();
    const rules = await PriceRule.findAll({
      where: {
        status: 'active',
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now },
      },
      include: [
        { model: Route, as: 'route', required: false },
        { model: BusType, as: 'busType', required: false },
      ],
      order: [['priority', 'DESC']],
    });
    return res.status(200).json(rules);
  } catch (error) {
    console.error('Lỗi lấy rule đang active:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const getPriceRuleById = async (req, res) => {
  try {
    const rule = await PriceRule.findByPk(req.params.id, {
      include: [
        { model: Route, as: 'route', required: false },
        { model: BusType, as: 'busType', required: false },
      ],
    });
    if (!rule) return res.status(404).json({ message: 'Không tìm thấy luật giá.' });
    return res.status(200).json(rule);
  } catch (error) {
    console.error('Lỗi lấy luật giá:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const createPriceRule = async (req, res) => {
  try {
    const {
      ruleName, routeId, busTypeId,
      priceMultiplier, priceDelta,
      startDate, endDate, priority, status,
    } = req.body;

    if (!ruleName || !startDate || !endDate) {
      return res.status(400).json({ message: 'Cần có ruleName, startDate và endDate.' });
    }
    if (!priceMultiplier && !priceDelta) {
      return res.status(400).json({ message: 'Phải có ít nhất priceMultiplier hoặc priceDelta.' });
    }

    const newRule = await PriceRule.create({
      ruleName,
      routeId: routeId || null,
      busTypeId: busTypeId || null,
      priceMultiplier: priceMultiplier || null,
      priceDelta: priceDelta || null,
      startDate,
      endDate,
      priority: priority || 1,
      status: status || 'active',
    });

    return res.status(201).json({ message: 'Tạo luật giá thành công!', data: newRule });
  } catch (error) {
    console.error('Lỗi tạo luật giá:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const updatePriceRule = async (req, res) => {
  try {
    const rule = await PriceRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Không tìm thấy luật giá.' });

    const {
      ruleName, routeId, busTypeId,
      priceMultiplier, priceDelta,
      startDate, endDate, priority, status,
    } = req.body;

    await rule.update({
      ruleName, routeId, busTypeId,
      priceMultiplier, priceDelta,
      startDate, endDate, priority, status,
    });

    return res.status(200).json({ message: 'Cập nhật luật giá thành công.', data: rule });
  } catch (error) {
    console.error('Lỗi cập nhật luật giá:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};

export const deletePriceRule = async (req, res) => {
  try {
    const rule = await PriceRule.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ message: 'Không tìm thấy luật giá.' });

    await rule.destroy();
    return res.status(200).json({ message: 'Đã xóa luật giá.' });
  } catch (error) {
    console.error('Lỗi xóa luật giá:', error);
    return res.status(500).json({ message: 'Lỗi hệ thống.' });
  }
};
