import { Panel } from '../components/Panels';
import { RoofOrientation } from '../components/RoofOrientations';
import { EstimateItem } from '../components/EstimateItems';
import { prettifyCurrency } from '../components/InputMask/masks';

export interface CalcProps {
    kwh: number,
    irradiation: number,
    panel: Panel,
    month_01: number,
    month_02: number,
    month_03: number,
    month_04: number,
    month_05: number,
    month_06: number,
    month_07: number,
    month_08: number,
    month_09: number,
    month_10: number,
    month_11: number,
    month_12: number,
    month_13: number,
    averageIncrease: number,
    roofOrientation: RoofOrientation,
    discount: number,
    increase: number,
    percent: boolean,
    estimateItems: EstimateItem[],
}

export interface CalcResultProps {
    monthsAverageKwh: number,
    finalAverageKwh: number,
    monthlyPaid: number,
    yearlyPaid: number,
    systemCapacityKwp: number,
    monthlyGeneratedEnergy: number,
    yearlyGeneratedEnergy: number,
    co2Reduction: number,
    systemArea: number,
    finalSystemCapacityKwp: number,
    systemInitialPrice: number,
    finalSystemPrice: number,
    estimateItems: EstimateItem[];
}

export function calculate(props: CalcProps) {
    //console.log('props: ', props);

    const values: CalcProps = {
        kwh: Number(props.kwh),
        irradiation: Number(props.irradiation),
        panel: props.panel,
        month_01: Number(props.month_01),
        month_02: Number(props.month_02),
        month_03: Number(props.month_03),
        month_04: Number(props.month_04),
        month_05: Number(props.month_05),
        month_06: Number(props.month_06),
        month_07: Number(props.month_07),
        month_08: Number(props.month_08),
        month_09: Number(props.month_09),
        month_10: Number(props.month_10),
        month_11: Number(props.month_11),
        month_12: Number(props.month_12),
        month_13: Number(props.month_13),
        averageIncrease: Number(props.averageIncrease),
        roofOrientation: props.roofOrientation,
        discount: Number(props.discount),
        increase: Number(props.increase),
        percent: props.percent,
        estimateItems: props.estimateItems,
    }

    //console.log('values: ', values);

    // Average
    const sum = values.month_01
        + values.month_02
        + values.month_03
        + values.month_04
        + values.month_05
        + values.month_06
        + values.month_07
        + values.month_08
        + values.month_09
        + values.month_10
        + values.month_11
        + values.month_12
        + values.month_13;

    const monthsAverageKwh = sum / 13;

    // Final average
    const finalAverageKwh = monthsAverageKwh + values.averageIncrease;


    // Monthly and yearly paid
    const monthlyPaid = finalAverageKwh * values.kwh;
    const yearlyPaid = monthlyPaid * 13;

    // System capacity kWp
    const systemCapacityKwp = finalAverageKwh / values.roofOrientation.increment;

    const foundCapacity = values.panel.prices.find(price => { return systemCapacityKwp <= price.potency });

    if (!foundCapacity) {
        return undefined;
    }

    // Amount panels.
    const panelsAmount = Math.ceil((foundCapacity.potency / values.panel.capacity) * 1000);

    // System area
    const systemArea = panelsAmount * 2.1;

    // System initial price.
    let systemInitialPrice = foundCapacity.price;

    let systemTempPrice = systemInitialPrice;

    // Amount structs.
    const structsAmount = Math.ceil(panelsAmount / 4);

    let tempEstimateItems: EstimateItem[] = values.estimateItems.map(estimateItem => {
        if (estimateItem.order === 0) {
            return {
                ...estimateItem,
                name: foundCapacity.inversor,
                price: systemInitialPrice * estimateItem.percent / 100 / estimateItem.amount,
            }
        }

        if (estimateItem.order === 1) {
            return {
                ...estimateItem,
                name: `${values.panel.name} - ${prettifyCurrency(String(values.panel.capacity))} W`,
                amount: panelsAmount,
                price: systemInitialPrice * estimateItem.percent / 100 / panelsAmount,
            }
        }

        if (estimateItem.order === 2) {
            return {
                ...estimateItem,
                amount: structsAmount,
                price: systemInitialPrice * estimateItem.percent / 100 / structsAmount,
            }
        }

        return {
            ...estimateItem,
            price: systemInitialPrice * estimateItem.percent / 100,
        }
    });

    let tempTotal = 0;
    tempEstimateItems.forEach(item => {
        tempTotal = Number(tempTotal) + item.amount * item.price;
    });

    systemTempPrice = tempTotal;
    systemInitialPrice = systemTempPrice;

    // Discount and increase.
    let finalSystemPrice = systemInitialPrice - (systemInitialPrice * values.discount / 100);

    if (!values.percent) finalSystemPrice = systemInitialPrice - values.discount;

    if (values.increase > 0) {
        finalSystemPrice = systemInitialPrice - (systemInitialPrice * values.increase / 100);

        if (!values.percent) finalSystemPrice = systemInitialPrice - values.increase;
    }

    // Smooth values.
    tempEstimateItems = tempEstimateItems.map(estimateItem => {
        if (estimateItem.order === 0) {
            return {
                ...estimateItem,
                price: finalSystemPrice * estimateItem.percent / 100 / estimateItem.amount,
            }
        }

        if (estimateItem.order === 1) {
            return {
                ...estimateItem,
                amount: panelsAmount,
                price: finalSystemPrice * estimateItem.percent / 100 / estimateItem.amount,
            }
        }

        if (estimateItem.order === 2) {
            return {
                ...estimateItem,
                amount: structsAmount,
                price: finalSystemPrice * estimateItem.percent / 100 / estimateItem.amount,
            }
        }

        return {
            ...estimateItem,
            price: finalSystemPrice * estimateItem.percent / 100,
        }
    });

    tempTotal = 0;
    tempEstimateItems.forEach(item => {
        tempTotal = Number(tempTotal) + item.amount * item.price;
    });

    systemTempPrice = tempTotal;
    finalSystemPrice = systemTempPrice;

    // Generated engergy.
    const monthlyGeneratedEnergy = foundCapacity.potency * values.roofOrientation.increment;
    const yearlyGeneratedEnergy = monthlyGeneratedEnergy * 12;

    // Co2 reduction
    const co2Reduction = monthlyGeneratedEnergy * 0.255 * 12;

    const valuesReturn: CalcResultProps = {
        monthsAverageKwh,
        finalAverageKwh,
        monthlyPaid,
        yearlyPaid,
        systemCapacityKwp,
        monthlyGeneratedEnergy,
        yearlyGeneratedEnergy,
        co2Reduction,
        systemArea,
        finalSystemCapacityKwp: Number(foundCapacity.potency),
        systemInitialPrice,
        finalSystemPrice,
        estimateItems: tempEstimateItems,
    }

    return valuesReturn;
}