import { useEffect, useState } from 'react';
import { Row, Col, Form, InputGroup, ListGroup, Modal, Button } from 'react-bootstrap';
import { FaSave } from 'react-icons/fa';
import { Formik } from 'formik';
import * as Yup from 'yup';

import api from '../../api/api';
import { Estimate } from '../Estimates';
import { AlertMessage, statusModal } from '../interfaces/AlertMessage';
import { prettifyCurrency } from '../InputMask/masks';

export interface EstimateItem {
    id: string;
    name: string;
    amount: number;
    price: number;
    percent: number;
    order: number;
}

interface EstimateItemsProps {
    estimateItem: EstimateItem;
    estimateItemsList: EstimateItem[];
    canEdit?: boolean;
    handleListEstimateItems?: (estimateItemsList: EstimateItem[]) => void;
}

const validationSchema = Yup.object().shape({
    potency: Yup.string().notRequired(),
    price: Yup.string().notRequired(),
    inversor: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
});

const EstimateItems: React.FC<EstimateItemsProps> = ({ estimateItem, estimateItemsList, canEdit = true, handleListEstimateItems }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState(0);
    const [price, setPrice] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);

    const [fieldsFormTouched, setFieldsFormTouched] = useState(false);

    const [showModalEditType, setShowModalEditType] = useState(false);

    const handleCloseModalEditType = () => { setShowModalEditType(false); setIconDeleteConfirm(false); setIconDelete(true); }
    const handleShowModalEditType = () => setShowModalEditType(true);

    const [messageShow, setMessageShow] = useState(false);
    const [statusMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    useEffect(() => {
        setName(estimateItem.name);
        setAmount(estimateItem.amount);
        setPrice(estimateItem.price);
        setTotalPrice(estimateItem.amount * estimateItem.price);
    }, [estimateItem]);

    async function deleteLine() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            await api.delete(`estimates/items/${estimateItem.id}`);

            handleCloseModalEditType();

            // if (handleListEstimateItems) handleListEstimateItems();
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete estimates items");
            console.log(err);
        }
    }

    function handleEstimateItem(name: string, amount: number, price: number) {
        const items = estimateItemsList.map(itemList => {
            if (itemList.id === estimateItem.id) {
                return {
                    ...itemList,
                    name,
                    amount,
                    price
                }
            }

            return itemList;
        });

        if (handleListEstimateItems) handleListEstimateItems(items);

        setFieldsFormTouched(false);
    }

    return (
        <Row>
            <Form.Group as={Col} sm={2} controlId="formGridAmount">
                <Form.Control
                    type="number"
                    onChange={e => {
                        try {
                            const newAmount = Number(e.target.value);

                            setAmount(newAmount);

                            handleEstimateItem(name, newAmount, price);
                        }
                        catch {
                            setAmount(1);
                            setFieldsFormTouched(true);
                        }
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        try {
                            const newAmount = Number(e.target.value);

                            setAmount(newAmount);

                            handleEstimateItem(name, newAmount, price);
                        }
                        catch {
                            setAmount(1);
                            setFieldsFormTouched(true);
                        }
                    }}
                    value={amount}
                    name="amount"
                    isInvalid={!!!amount}
                    disabled={!canEdit}
                />
            </Form.Group>

            <Form.Group as={Col} sm={5} controlId="formGridName">
                <Form.Control
                    type="name"
                    onChange={e => {
                        setName(e.target.value);

                        setFieldsFormTouched(true);
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        setName(e.target.value);

                        setFieldsFormTouched(true);
                    }}
                    value={estimateItem.name}
                    name="name"
                    isInvalid={!!!name}
                />
            </Form.Group>

            <Form.Group as={Col} sm={2} controlId="formGridPrice">
                <InputGroup className="mb-2">
                    <InputGroup.Prepend>
                        <InputGroup.Text id="btnGroupPrice">R$</InputGroup.Text>
                    </InputGroup.Prepend>
                    <Form.Control
                        type="text"
                        value={prettifyCurrency(price.toFixed(2))}
                        name="price"
                        isInvalid={!!!price}
                        aria-label="Valor unitário"
                        aria-describedby="btnGroupPrice"
                        readOnly
                    />
                </InputGroup>
            </Form.Group>

            <Form.Group as={Col} sm={2} controlId="formGridTotalPrice">
                <InputGroup className="mb-2">
                    <InputGroup.Prepend>
                        <InputGroup.Text id="btnGroupTotalPrice">R$</InputGroup.Text>
                    </InputGroup.Prepend>
                    <Form.Control
                        type="text"
                        value={prettifyCurrency(totalPrice.toFixed(2))}
                        name="total_price"
                        isInvalid={!!!totalPrice}
                        aria-label="Valor Total"
                        aria-describedby="btnGroupTotalPrice"
                        readOnly
                    />
                </InputGroup>
            </Form.Group>

            <Col className="col-row text-end">
                <Button
                    variant="outline-success"
                    className="button-link"
                    onClick={() => {
                        handleEstimateItem(name, amount, price);
                    }}
                    disabled={!fieldsFormTouched}
                >
                    <FaSave />
                </Button>
            </Col>
        </Row>
    )
}

export default EstimateItems;