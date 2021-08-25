import { useContext, useEffect, useState } from 'react';
import { Button, Col, Form, InputGroup, ListGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { FaHistory, FaPlus } from 'react-icons/fa';

import api from '../../../api/api';
import { can } from '../../Users';
import { AuthContext } from '../../../contexts/AuthContext';
import { Income } from '../../Incomings';
import IncomeItems from '../../IncomeItems';
import { PayType } from '../../PayTypes';
import Shimmer from '../Shimmer';
import { prettifyCurrency } from '../../InputMask/masks';
import { PageWaiting } from '../../PageWaiting';
import { AlertMessage, statusModal } from '../../Interfaces/AlertMessage'

interface IncomeModalProps {
    incomeId: string;
    show: boolean;
    handleIncome?: () => Promise<void>;
}

const validationSchema = Yup.object().shape({
    description: Yup.string().required('Obrigatório!').max(50, 'Deve conter no máximo 50 caracteres!'),
    value: Yup.string().required('Obrigatório!'),
    project: Yup.string().notRequired().nullable(),
    payType: Yup.string().required('Obrigatório!'),
});

const IncomeModal: React.FC<IncomeModalProps> = ({ incomeId, show = false, handleIncome }) => {
    const { user } = useContext(AuthContext);
    const [data, setData] = useState<Income>();
    const [payTypes, setPayTypes] = useState<PayType[]>([]);

    const [showModalEdit, setShowModalEdit] = useState(show);

    const handleCloseModalEdit = () => setShowModalEdit(false);

    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");

    const [hasErrors, setHasErrors] = useState(false);
    const [isCreatingItem, setIsCreatingItem] = useState(false);

    const [iconDelete, setIconDelete] = useState(true);
    const [iconDeleteConfirm, setIconDeleteConfirm] = useState(false);

    useEffect(() => {
        setHasErrors(false);

        if (user && can(user, "finances", "update:any")) {
            api.get(`incomings/${incomeId}`).then(res => {
                setData(res.data);

                api.get('payments/types').then(res => {
                    setPayTypes(res.data);
                }).catch(err => {
                    console.log('Error to get project status, ', err);

                    setHasErrors(true);
                });
            }).catch(err => {
                console.log('Error to get income to edit, ', err);

                setHasErrors(true);
            });
        }

    }, [user, incomeId]); // eslint-disable-line react-hooks/exhaustive-deps

    async function deleteItem() {
        if (iconDelete) {
            setIconDelete(false);
            setIconDeleteConfirm(true);

            return;
        }

        setTypeMessage("waiting");
        setMessageShow(true);

        try {
            if (data) {
                await api.delete(`incomings/${data.id}`);

                handleCloseModalEdit();

                if (handleIncome) handleIncome();
            }
        }
        catch (err) {
            setIconDeleteConfirm(false);
            setIconDelete(true);

            setTypeMessage("error");
            setMessageShow(true);

            setTimeout(() => {
                setMessageShow(false);
            }, 4000);

            console.log("Error to delete income");
            console.log(err);
        }
    }

    async function handleListItems() {
        try {
            if (user && can(user, "finances", "update:any") && data) {
                const res = await api.get(`incomings/${incomeId}`);

                const updatedIncome: Income = res.data;

                setData({ ...data, items: updatedIncome.items });
            }
        }
        catch (err) {
            console.log("Error to update income");
            console.log(err);
        }
    }

    async function handleNewItem() {
        try {
            if (user && can(user, "finances", "update:any") && data) {
                setIsCreatingItem(true);

                await api.post('incomings', {
                    description: 'Novo pagamento',
                    value: 0,
                    income: data.id,
                });

                const res = await api.get(`incomings/${incomeId}`);

                const updatedIncome: Income = res.data;

                setData({ ...data, items: updatedIncome.items });

                setIsCreatingItem(false);
            }
        }
        catch (err) {
            console.log("Error to create income");
            console.log(err);

            setIsCreatingItem(false);
        }
    }

    return (
        <Modal size="lg" show={showModalEdit} onHide={() => handleCloseModalEdit()}>
            <Modal.Header closeButton>
                <Modal.Title>Edtiar receita</Modal.Title>
            </Modal.Header>
            {
                user && can(user, "finances", "update:any") ? <>
                    {
                        data ? <>
                            <Formik
                                initialValues={
                                    {
                                        description: data.description,
                                        value: prettifyCurrency(String(data.value)),
                                        done: false,
                                        created_at: data.created_at,
                                        project: data.project,
                                        payType: data.payType.id,
                                    }
                                }
                                onSubmit={async values => {
                                    setTypeMessage("waiting");
                                    setMessageShow(true);

                                    try {
                                        if (data.id === '0') {
                                            await api.post('projects/events', {
                                                description: values.description,
                                                done: values.done,
                                                created_at: values.created_at,
                                                project: data.project ? data.project.id : null,
                                            });
                                        }
                                        else {
                                            await api.put(`projects/events/${data.id}`, {
                                                description: values.description,
                                                done: values.done,
                                                created_at: values.created_at,
                                            });
                                        }

                                        if (handleIncome) await handleIncome();

                                        setTypeMessage("success");

                                        setTimeout(() => {
                                            setMessageShow(false);
                                            handleCloseModalEdit();
                                        }, 1000);
                                    }
                                    catch (err) {
                                        console.log('error edit data.');
                                        console.log(err);

                                        setTypeMessage("error");

                                        setTimeout(() => {
                                            setMessageShow(false);
                                        }, 4000);
                                    }
                                }}
                                validationSchema={validationSchema}
                            >
                                {({ handleChange, handleBlur, handleSubmit, values, setFieldValue, errors, touched }) => (
                                    <Form onSubmit={handleSubmit}>
                                        <Modal.Body>
                                            <Form.Group className="mb-3" controlId="incomeFormGridDescription">
                                                <Form.Label>Descrição</Form.Label>
                                                <Form.Control
                                                    placeholder="Descrição da despesa"
                                                    onChange={handleChange}
                                                    onBlur={handleBlur}
                                                    value={values.description}
                                                    name="description"
                                                    isInvalid={!!errors.description && touched.description}
                                                />
                                                <Form.Control.Feedback type="invalid">{touched.description && errors.description}</Form.Control.Feedback>
                                                <Form.Text className="text-muted text-right">{`${values.description.length}/50 caracteres.`}</Form.Text>
                                            </Form.Group>

                                            <Row className="mb-3">
                                                <Form.Group as={Col} sm={3} controlId="formGridValue">
                                                    <Form.Label>Valor</Form.Label>
                                                    <InputGroup className="mb-2">
                                                        <InputGroup.Text id="btnGroupValue">R$</InputGroup.Text>
                                                        <Form.Control
                                                            type="text"
                                                            onChange={(e) => {
                                                                setFieldValue('value', prettifyCurrency(e.target.value));
                                                            }}
                                                            onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                setFieldValue('value', prettifyCurrency(e.target.value));
                                                            }}
                                                            value={values.value}
                                                            name="value"
                                                            isInvalid={!!errors.value && touched.value}
                                                            aria-label="Valor do projeto"
                                                            aria-describedby="btnGroupValue"
                                                        />
                                                    </InputGroup>
                                                    <Form.Control.Feedback type="invalid">{touched.value && errors.value}</Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group as={Col} sm={5} controlId="formGridPayType">
                                                    <Form.Label>Forma de pagamento</Form.Label>
                                                    <Form.Control
                                                        as="select"
                                                        onChange={handleChange}
                                                        onBlur={handleBlur}
                                                        value={values.payType}
                                                        name="payType"
                                                        isInvalid={!!errors.payType && touched.payType}
                                                    >
                                                        <option hidden>...</option>
                                                        {
                                                            payTypes.map((payType, index) => {
                                                                return <option key={index} value={payType.id}>{payType.name}</option>
                                                            })
                                                        }
                                                    </Form.Control>
                                                    <Form.Control.Feedback type="invalid">{touched.payType && errors.payType}</Form.Control.Feedback>
                                                </Form.Group>
                                            </Row>
                                        </Modal.Body>
                                        <Modal.Footer>
                                            {
                                                messageShow ? <AlertMessage status={typeMessage} /> :
                                                    <>
                                                        <Button variant="secondary" onClick={handleCloseModalEdit}>Cancelar</Button>
                                                        <Button
                                                            title="Excluir item"
                                                            variant={iconDelete ? "outline-danger" : "outline-warning"}
                                                            onClick={deleteItem}
                                                        >
                                                            {
                                                                iconDelete && "Excluir"
                                                            }

                                                            {
                                                                iconDeleteConfirm && "Confirmar"
                                                            }
                                                        </Button>
                                                        <Button variant="success" type="submit">Salvar</Button>
                                                    </>

                                            }
                                        </Modal.Footer>
                                    </Form>
                                )}
                            </Formik>

                            <Row className="mb-3">
                                <Col>
                                    <Row>
                                        <Col className="col-row">
                                            <h6 className="text-success">Pagamentos <FaHistory /></h6>
                                        </Col>

                                        <Col sm={1}>
                                            <Button
                                                variant="outline-success"
                                                size="sm"
                                                onClick={handleNewItem}
                                                title="Criar um novo pagamento para essa receita."
                                            >
                                                {
                                                    isCreatingItem ? <Spinner
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                    /> :
                                                        <FaPlus />
                                                }
                                            </Button>
                                        </Col>
                                    </Row>

                                    <Row className="mt-2">
                                        <Col>
                                            <ListGroup className="mb-3">
                                                {
                                                    data.items.map(item => {
                                                        return <IncomeItems
                                                            key={item.id}
                                                            item={item}
                                                            handleListItems={handleListItems}
                                                        />
                                                    })
                                                }
                                            </ListGroup>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </> :
                            <>
                                {
                                    hasErrors ? <PageWaiting
                                        status="error"
                                        message="Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos."
                                    /> :
                                        <Shimmer />
                                }
                            </>

                    }
                </> :
                    <PageWaiting status="warning" message="Acesso negado!" />
            }
        </Modal>
    )
}

export default IncomeModal;