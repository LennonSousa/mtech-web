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

export function Calculate(props: CalcProps) {
    console.log('props: ', props);
    // Average
    const sum = props.month_01
        + props.month_02
        + props.month_03
        + props.month_04
        + props.month_05
        + props.month_06
        + props.month_07
        + props.month_08
        + props.month_09
        + props.month_10
        + props.month_11
        + props.month_12
        + props.month_13;

    const monthsAverageKwh = sum / 13;

    // Final average
    const finalAverageKwh = monthsAverageKwh + props.averageIncrease;

    // Monthly and yearly paid
    const monthlyPaid = finalAverageKwh * props.kwh;
    const yearlyPaid = monthlyPaid * 13;

    // System capacity Wp
    const systemCapacityKwp = finalAverageKwh / props.roofOrientation.increment;

    const foundCapacity = props.panel.prices.find(price => { return systemCapacityKwp <= price.potency });

    if (!foundCapacity) {
        return undefined;
    }

    // Amount panels.
    const panelsAmount = Math.ceil((foundCapacity.potency / props.panel.capacity) * 1000);

    // System area
    const systemArea = panelsAmount * 2.1;

    // System initial price.
    let systemInitialPrice = foundCapacity.price;

    let systemTempPrice = systemInitialPrice;

    // Amount structs.
    const structsAmount = Math.ceil(panelsAmount / 4);

    let tempEstimateItems: EstimateItem[] = props.estimateItems.map(estimateItem => {
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
                name: `${props.panel.name} - ${prettifyCurrency(String(props.panel.capacity))} Wp`,
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
    let finalSystemPrice = systemInitialPrice - (systemInitialPrice * props.discount / 100);

    if (!props.percent) finalSystemPrice = systemInitialPrice - props.discount;

    if (props.increase > 0) {
        finalSystemPrice = systemInitialPrice - (systemInitialPrice * props.increase / 100);

        if (!props.percent) finalSystemPrice = systemInitialPrice - props.increase;
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
    const monthlyGeneratedEnergy = foundCapacity.potency * props.roofOrientation.increment;
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