import { useContext, useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { NextSeo } from 'next-seo';
import { Button, Col, Container, Form, InputGroup, ListGroup, Row, Spinner, Toast } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { FaCashRegister, FaPlus, FaUserTie, FaPlug, FaSolarPanel } from 'react-icons/fa';
import cep, { CEP } from 'cep-promise';

import api from '../../../api/api';
import { TokenVerify } from '../../../utils/tokenVerify';
import { SideBarContext } from '../../../contexts/SideBarContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { User, can } from '../../../components/Users';
import { Panel } from '../../../components/Panels';
import { RoofOrientation } from '../../../components/RoofOrientations';
import { RoofType } from '../../../components/RoofTypes';
import { EstimateStatus } from '../../../components/EstimateStatus';
import Members from '../../../components/EstimateMembers';
import { cpf, cnpj, cellphone } from '../../../components/InputMask/masks';
import { statesCities } from '../../../components/StatesCities';
import PageBack from '../../../components/PageBack';
import { PageWaiting, PageType } from '../../../components/PageWaiting';
import { AlertMessage, statusModal } from '../../../components/interfaces/AlertMessage';
import { prettifyCurrency } from '../../../components/InputMask/masks';

const validationSchema = Yup.object().shape({
    customer: Yup.string().required('Obrigatório!'),
    document: Yup.string().min(14, 'CPF inválido!').max(18, 'CNPJ inválido!').required('Obrigatório!'),
    phone: Yup.string().notRequired(),
    cellphone: Yup.string().notRequired().nullable(),
    contacts: Yup.string().notRequired().nullable(),
    email: Yup.string().email('E-mail inválido!').notRequired().nullable(),
    zip_code: Yup.string().notRequired().min(8, 'Deve conter no mínimo 8 caracteres!').max(8, 'Deve conter no máximo 8 caracteres!'),
    street: Yup.string().notRequired(),
    number: Yup.string().notRequired(),
    neighborhood: Yup.string().notRequired(),
    complement: Yup.string().notRequired().nullable(),
    city: Yup.string().required('Obrigatório!'),
    state: Yup.string().required('Obrigatório!'),
    energy_company: Yup.string().required('Obrigatório!'),
    unity: Yup.string().required('Obrigatório!'),
    kwh: Yup.number().required('Obrigatório!'),
    irradiation: Yup.number().required('Obrigatório!'),
    month_01: Yup.number().required('Obrigatório!'),
    month_02: Yup.number().required('Obrigatório!'),
    month_03: Yup.number().required('Obrigatório!'),
    month_04: Yup.number().required('Obrigatório!'),
    month_05: Yup.number().required('Obrigatório!'),
    month_06: Yup.number().required('Obrigatório!'),
    month_07: Yup.number().required('Obrigatório!'),
    month_08: Yup.number().required('Obrigatório!'),
    month_09: Yup.number().required('Obrigatório!'),
    month_10: Yup.number().required('Obrigatório!'),
    month_11: Yup.number().required('Obrigatório!'),
    month_12: Yup.number().required('Obrigatório!'),
    month_13: Yup.number().required('Obrigatório!'),
    average_increase: Yup.number().required('Obrigatório!'),
    discount: Yup.number().required('Obrigatório!'),
    increase: Yup.number().required('Obrigatório!'),
    percent: Yup.boolean().notRequired(),
    show_values: Yup.boolean().notRequired(),
    show_discount: Yup.boolean().notRequired(),
    notes: Yup.string().notRequired().nullable(),
    user: Yup.string().notRequired().nullable(),
    panel: Yup.string().required('Obrigatório!'),
    roof_orientation: Yup.string().required('Obrigatório!'),
    roof_type: Yup.string().required('Obrigatório!'),
    status: Yup.string().required('Obrigatório!'),
});

export default function NewCustomer() {
    const router = useRouter();

    const { handleItemSideBar, handleSelectedMenu } = useContext(SideBarContext);
    const { loading, user } = useContext(AuthContext);

    const [users, setUsers] = useState<User[]>([]);
    const [usersToAdd, setUsersToAdd] = useState<User[]>([]);

    const [panels, setPanels] = useState<Panel[]>([]);
    const [roofOrientations, setRoofOrientations] = useState<RoofOrientation[]>([]);
    const [roofTypes, setRoofTypes] = useState<RoofType[]>([]);
    const [estimateStatusList, setEstimateStatusList] = useState<EstimateStatus[]>([]);

    const [spinnerCep, setSpinnerCep] = useState(false);
    const [messageShow, setMessageShow] = useState(false);
    const [typeMessage, setTypeMessage] = useState<statusModal>("waiting");
    const [documentType, setDocumentType] = useState("CPF");
    const [cities, setCities] = useState<string[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [hasErrors, setHasErrors] = useState(false);
    const [typeLoadingMessage, setTypeLoadingMessage] = useState<PageType>("waiting");
    const [textLoadingMessage, setTextLoadingMessage] = useState('Aguarde, carregando...');

    const [showUsers, setShowUsers] = useState(false);

    const toggleShowUsers = () => setShowUsers(!showUsers);

    useEffect(() => {
        handleItemSideBar('estimates');
        handleSelectedMenu('estimates-new');

        if (user) {
            if (can(user, "estimates", "create")) {
                api.get('panels').then(res => {
                    setPanels(res.data);
                }).catch(err => {
                    console.log('Error to get panels, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                api.get('roofs/orientations').then(res => {
                    setRoofOrientations(res.data);
                }).catch(err => {
                    console.log('Error to get roofs orientations, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                api.get('roofs/types').then(res => {
                    setRoofTypes(res.data);
                }).catch(err => {
                    console.log('Error to get roofs types, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });

                api.get('estimates/status').then(res => {
                    setEstimateStatusList(res.data);

                    setLoadingData(false);
                }).catch(err => {
                    console.log('Error to get estimates status, ', err);

                    setTypeLoadingMessage("error");
                    setTextLoadingMessage("Não foi possível carregar os dados, verifique a sua internet e tente novamente em alguns minutos.");
                    setHasErrors(true);
                });
            }
        }

    }, [user]);

    return (
        <>
            <NextSeo
                title="Criar orçamento"
                description="Criar orçamento da plataforma de gerenciamento da Bioma consultoria."
                openGraph={{
                    url: 'https://app.biomaconsultoria.com',
                    title: 'Criar orçamento',
                    description: 'Criar orçamento da plataforma de gerenciamento da Bioma consultoria.',
                    images: [
                        {
                            url: 'https://app.biomaconsultoria.com/assets/images/logo-bioma.jpg',
                            alt: 'Criar orçamento | Plataforma Bioma',
                        },
                        { url: 'https://app.biomaconsultoria.com/assets/images/logo-bioma.jpg' },
                    ],
                }}
            />

            {
                !user || loading ? <PageWaiting status="waiting" /> :
                    <>
                        {
                            can(user, "projects", "create") ? <>
                                {
                                    loadingData || hasErrors ? <PageWaiting
                                        status={typeLoadingMessage}
                                        message={textLoadingMessage}
                                    /> :
                                        <Container className="content-page">
                                            <Row className="mb-3">
                                                <Col>
                                                    <PageBack href="/estimates" subTitle="Voltar para a lista de orçamentos" />
                                                </Col>
                                            </Row>

                                            <Row className="mb-3">
                                                <Col>
                                                    <Row>
                                                        <Col>
                                                            <h6 className="text-success">Vendedor</h6>
                                                        </Col>
                                                    </Row>
                                                    <Row>
                                                        <Members user={user} />
                                                    </Row>
                                                </Col>
                                            </Row>

                                            <Formik
                                                initialValues={{
                                                    customer: '',
                                                    document: '',
                                                    phone: '',
                                                    cellphone: '',
                                                    contacts: '',
                                                    email: '',
                                                    zip_code: '',
                                                    street: '',
                                                    number: '',
                                                    neighborhood: '',
                                                    complement: '',
                                                    city: '',
                                                    state: '',
                                                    energy_company: '',
                                                    unity: '',
                                                    kwh: 0,
                                                    irradiation: 0,
                                                    month_01: 0,
                                                    month_02: 0,
                                                    month_03: 0,
                                                    month_04: 0,
                                                    month_05: 0,
                                                    month_06: 0,
                                                    month_07: 0,
                                                    month_08: 0,
                                                    month_09: 0,
                                                    month_10: 0,
                                                    month_11: 0,
                                                    month_12: 0,
                                                    month_13: 0,
                                                    average_increase: 0,
                                                    discount: 0,
                                                    increase: 0,
                                                    percent: false,
                                                    show_values: false,
                                                    show_discount: false,
                                                    notes: '',
                                                    user: user.id,
                                                    panel: '',
                                                    roof_orientation: '',
                                                    roof_type: '',
                                                    status: '',
                                                }}
                                                onSubmit={async values => {
                                                    setTypeMessage("waiting");
                                                    setMessageShow(true);

                                                    try {
                                                        const res = await api.post('estimates', {
                                                            customer: values.customer,
                                                            document: values.document,
                                                            phone: values.phone,
                                                            cellphone: values.cellphone,
                                                            contacts: values.contacts,
                                                            email: values.email,
                                                            zip_code: values.zip_code,
                                                            street: values.street,
                                                            number: values.number,
                                                            neighborhood: values.neighborhood,
                                                            complement: values.complement,
                                                            city: values.city,
                                                            state: values.state,
                                                            energy_company: values.energy_company,
                                                            unity: values.unity,
                                                            kwh: values.kwh,
                                                            irradiation: values.irradiation,
                                                            month_01: values.month_01,
                                                            month_02: values.month_02,
                                                            month_03: values.month_03,
                                                            month_04: values.month_04,
                                                            month_05: values.month_05,
                                                            month_06: values.month_06,
                                                            month_07: values.month_07,
                                                            month_08: values.month_08,
                                                            month_09: values.month_09,
                                                            month_10: values.month_10,
                                                            month_11: values.month_11,
                                                            month_12: values.month_12,
                                                            month_13: values.month_13,
                                                            average_increase: values.average_increase,
                                                            discount: values.discount,
                                                            increase: values.increase,
                                                            percent: values.percent,
                                                            show_values: values.show_values,
                                                            show_discount: values.show_discount,
                                                            notes: values.notes,
                                                            user: values.user,
                                                            panel: values.panel,
                                                            roof_orientation: values.roof_orientation,
                                                            roof_type: values.roof_type,
                                                            status: values.status,
                                                        });

                                                        setTypeMessage("success");

                                                        setTimeout(() => {
                                                            router.push(`/estimates/details/${res.data.id}`)
                                                        }, 2000);
                                                    }
                                                    catch {
                                                        setTypeMessage("error");

                                                        setTimeout(() => {
                                                            setMessageShow(false);
                                                        }, 4000);
                                                    }
                                                }}
                                                validationSchema={validationSchema}
                                            >
                                                {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
                                                    <Form onSubmit={handleSubmit}>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Cliente <FaUserTie /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={8} controlId="formGridName">
                                                                <Form.Label>Nome do cliente*</Form.Label>
                                                                <Form.Control
                                                                    type="name"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.customer}
                                                                    name="customer"
                                                                    isInvalid={!!errors.customer && touched.customer}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.customer && errors.customer}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridDocument">
                                                                <Form.Label>{documentType}</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    maxLength={18}
                                                                    onChange={(e) => {
                                                                        setFieldValue('document', e.target.value.length <= 14 ? cpf(e.target.value) : cnpj(e.target.value), false);
                                                                        if (e.target.value.length > 14)
                                                                            setDocumentType("CNPJ");
                                                                        else
                                                                            setDocumentType("CPF");
                                                                    }}
                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                        setFieldValue('document', e.target.value.length <= 14 ? cpf(e.target.value) : cnpj(e.target.value));
                                                                        if (e.target.value.length > 14)
                                                                            setDocumentType("CNPJ");
                                                                        else
                                                                            setDocumentType("CPF");
                                                                    }}
                                                                    value={values.document}
                                                                    name="document"
                                                                    isInvalid={!!errors.document && touched.document}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.document && errors.document}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={3} controlId="formGridPhone">
                                                                <Form.Label>Celular</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    maxLength={15}
                                                                    onChange={(e) => {
                                                                        setFieldValue('phone', cellphone(e.target.value));
                                                                    }}
                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                        setFieldValue('phone', cellphone(e.target.value));
                                                                    }}
                                                                    value={values.phone}
                                                                    name="phone"
                                                                    isInvalid={!!errors.phone && touched.phone}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.phone && errors.phone}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridCellphone">
                                                                <Form.Label>Celular secundáiro</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    maxLength={15}
                                                                    onChange={(e) => {
                                                                        setFieldValue('cellphone', cellphone(e.target.value));
                                                                    }}
                                                                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                        setFieldValue('cellphone', cellphone(e.target.value));
                                                                    }}
                                                                    value={values.cellphone}
                                                                    name="cellphone"
                                                                    isInvalid={!!errors.cellphone && touched.cellphone}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.cellphone && errors.cellphone}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={6} controlId="formGridEmail">
                                                                <Form.Label>E-mail</Form.Label>
                                                                <Form.Control
                                                                    type="email"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.email}
                                                                    name="email"
                                                                    isInvalid={!!errors.email && touched.email}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.email && errors.email}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} controlId="formGridContacts">
                                                                <Form.Label>Outros contatos</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.contacts}
                                                                    name="contacts"
                                                                    isInvalid={!!errors.contacts && touched.contacts}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.contacts && errors.contacts}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} lg={2} md={3} sm={5} controlId="formGridZipCode">
                                                                <Form.Label>CEP</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    placeholder="00000000"
                                                                    onChange={(e) => {
                                                                        handleChange(e);

                                                                        if (e.target.value !== '' && e.target.value.length === 8) {
                                                                            setSpinnerCep(true);
                                                                            cep(e.target.value)
                                                                                .then((cep: CEP) => {
                                                                                    const { street, neighborhood, city, state } = cep;

                                                                                    setFieldValue('street', street);
                                                                                    setFieldValue('neighborhood', neighborhood);
                                                                                    setFieldValue('city', city);
                                                                                    setFieldValue('state', state);

                                                                                    setSpinnerCep(false);
                                                                                })
                                                                                .catch(() => {
                                                                                    setSpinnerCep(false);
                                                                                });
                                                                        }
                                                                    }}
                                                                    value={values.zip_code}
                                                                    name="zip_code"
                                                                    isInvalid={!!errors.zip_code && touched.zip_code}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.zip_code && errors.zip_code}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Col style={{ display: 'flex', alignItems: 'center' }}>
                                                                {
                                                                    spinnerCep && <Spinner
                                                                        as="span"
                                                                        animation="border"
                                                                        variant="info"
                                                                        role="status"
                                                                        size="sm"
                                                                        aria-hidden="true"
                                                                    />
                                                                }
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={10} controlId="formGridStreet">
                                                                <Form.Label>Rua</Form.Label>
                                                                <Form.Control
                                                                    type="address"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.street}
                                                                    name="street"
                                                                    isInvalid={!!errors.street && touched.street}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.street && errors.street}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={2} controlId="formGridNumber">
                                                                <Form.Label>Número</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.number}
                                                                    name="number"
                                                                    isInvalid={!!errors.number && touched.number}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.number && errors.number}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} controlId="formGridComplement">
                                                                <Form.Label>Complemento</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.complement}
                                                                    name="complement"
                                                                    isInvalid={!!errors.complement && touched.complement}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.complement && errors.complement}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={6} controlId="formGridNeighborhood">
                                                                <Form.Label>Bairro</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.neighborhood}
                                                                    name="neighborhood"
                                                                    isInvalid={!!errors.neighborhood && touched.neighborhood}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.neighborhood && errors.neighborhood}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={2} controlId="formGridState">
                                                                <Form.Label>Estado</Form.Label>
                                                                <Form.Control
                                                                    as="select"
                                                                    onChange={(e) => {
                                                                        setFieldValue('state', e.target.value);
                                                                        const stateCities = statesCities.estados.find(item => { return item.nome === e.target.value })

                                                                        if (stateCities)
                                                                            setCities(stateCities.cidades);
                                                                    }}
                                                                    onBlur={handleBlur}
                                                                    value={values.state ? values.state : '...'}
                                                                    name="state"
                                                                    isInvalid={!!errors.state && touched.state}
                                                                >
                                                                    <option hidden>...</option>
                                                                    {
                                                                        statesCities.estados.map((estado, index) => {
                                                                            return <option key={index} value={estado.nome}>{estado.nome}</option>
                                                                        })
                                                                    }
                                                                </Form.Control>
                                                                <Form.Control.Feedback type="invalid">{touched.state && errors.state}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridCity">
                                                                <Form.Label>Cidade</Form.Label>
                                                                <Form.Control
                                                                    as="select"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.city ? values.city : '...'}
                                                                    name="city"
                                                                    isInvalid={!!errors.city && touched.city}
                                                                    disabled={!!!values.state}
                                                                >
                                                                    <option hidden>...</option>
                                                                    {
                                                                        !!values.state && cities.map((city, index) => {
                                                                            return <option key={index} value={city}>{city}</option>
                                                                        })
                                                                    }
                                                                </Form.Control>
                                                                <Form.Control.Feedback type="invalid">{touched.city && errors.city}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Col className="border-top mb-3"></Col>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Consumo <FaPlug /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={8} controlId="formGridEngeryCompany">
                                                                <Form.Label>Concessionária de energia</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.energy_company}
                                                                    name="energy_company"
                                                                    isInvalid={!!errors.energy_company && touched.energy_company}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.energy_company && errors.energy_company}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridUnity">
                                                                <Form.Label>Unidade consumidora (UC)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.unity}
                                                                    name="unity"
                                                                    isInvalid={!!errors.unity && touched.unity}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.unity && errors.unity}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={3} controlId="formGridKwh">
                                                                <Form.Label>Valor unitário do Quilowatts x Hora</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.kwh}
                                                                    name="kwh"
                                                                    isInvalid={!!errors.kwh && touched.kwh}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.kwh && errors.kwh}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridIrratiation">
                                                                <Form.Label>Irradiação Local em [Kwh/m².dia] (Cresesb)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.irradiation}
                                                                    name="irradiation"
                                                                    isInvalid={!!errors.irradiation && touched.irradiation}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.irradiation && errors.irradiation}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={6} controlId="formGridPanel">
                                                                <Form.Label>Painél fotovoltaico (Wp)</Form.Label>
                                                                <Form.Control
                                                                    as="select"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.panel}
                                                                    name="panel"
                                                                    isInvalid={!!errors.panel && touched.panel}
                                                                >
                                                                    <option hidden>Escolha uma opção</option>
                                                                    {
                                                                        panels.map((panel, index) => {
                                                                            return <option key={index} value={panel.id}>{
                                                                                `${panel.name} - ${panel.capacity} Wp`
                                                                            }</option>
                                                                        })
                                                                    }
                                                                </Form.Control>
                                                                <Form.Control.Feedback type="invalid">{touched.panel && errors.panel}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth01">
                                                                <Form.Label>Mês 01</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_01}
                                                                    name="month_01"
                                                                    isInvalid={!!errors.month_01 && touched.month_01}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_01 && errors.month_01}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth02">
                                                                <Form.Label>Mês 02</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_02}
                                                                    name="month_02"
                                                                    isInvalid={!!errors.month_02 && touched.month_02}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_02 && errors.month_02}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth03">
                                                                <Form.Label>Mês 03</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_03}
                                                                    name="month_03"
                                                                    isInvalid={!!errors.month_03 && touched.month_03}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_03 && errors.month_03}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth04">
                                                                <Form.Label>Mês 04</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_04}
                                                                    name="month_04"
                                                                    isInvalid={!!errors.month_04 && touched.month_04}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_04 && errors.month_04}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth05">
                                                                <Form.Label>Mês 05</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_05}
                                                                    name="month_05"
                                                                    isInvalid={!!errors.month_05 && touched.month_05}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_05 && errors.month_05}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth06">
                                                                <Form.Label>Mês 06</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_06}
                                                                    name="month_06"
                                                                    isInvalid={!!errors.month_06 && touched.month_06}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_06 && errors.month_06}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth07">
                                                                <Form.Label>Mês 07</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_07}
                                                                    name="month_07"
                                                                    isInvalid={!!errors.month_07 && touched.month_07}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_07 && errors.month_07}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth08">
                                                                <Form.Label>Mês 08</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_08}
                                                                    name="month_08"
                                                                    isInvalid={!!errors.month_08 && touched.month_08}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_08 && errors.month_08}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth09">
                                                                <Form.Label>Mês 09</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_09}
                                                                    name="month_09"
                                                                    isInvalid={!!errors.month_09 && touched.month_09}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_09 && errors.month_09}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth10">
                                                                <Form.Label>Mês 10</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_10}
                                                                    name="month_10"
                                                                    isInvalid={!!errors.month_10 && touched.month_10}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_10 && errors.month_10}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth11">
                                                                <Form.Label>Mês 11</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_11}
                                                                    name="month_11"
                                                                    isInvalid={!!errors.month_11 && touched.month_11}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_11 && errors.month_11}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth12">
                                                                <Form.Label>Mês 12</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_12}
                                                                    name="month_12"
                                                                    isInvalid={!!errors.month_12 && touched.month_12}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_12 && errors.month_12}</Form.Control.Feedback>
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={3} controlId="formGridMonth13">
                                                                <Form.Label>Mês 13</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.month_13}
                                                                    name="month_13"
                                                                    isInvalid={!!errors.month_13 && touched.month_13}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.month_13 && errors.month_13}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridMonthsAverage">
                                                                <Form.Label>Média</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={values.month_02}
                                                                    name="months_average"
                                                                    readOnly
                                                                />
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridAverageIncrease">
                                                                <Form.Label>Previsão de aumento (Kwh)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.average_increase}
                                                                    name="average_increase"
                                                                    isInvalid={!!errors.average_increase && touched.average_increase}
                                                                />
                                                                <Form.Control.Feedback type="invalid">{touched.average_increase && errors.average_increase}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridFinalAverage">
                                                                <Form.Label>Consumo final</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={values.month_04}
                                                                    name="final_average"
                                                                    readOnly
                                                                />
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Projeto <FaSolarPanel /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={4} controlId="formGridMonthlyPaid">
                                                                <Form.Label>Valor médio mensal da conta de energia</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={values.month_02}
                                                                    name="monthly_paid"
                                                                    readOnly
                                                                />
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridYearlyPaid">
                                                                <Form.Label>Valor pago anualmente</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={values.month_02}
                                                                    name="yearly_paid"
                                                                    readOnly
                                                                />
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridPanelsAmount">
                                                                <Form.Label>Número total de Painéis Fotovoltaicos</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={values.month_04}
                                                                    name="panels_amount"
                                                                    readOnly
                                                                />
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={4} controlId="formGridSystemCapacity">
                                                                <Form.Label>Capacidade Total do Sistema Fotovoltaico (Kwp)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={values.month_02}
                                                                    name="system_capacity"
                                                                    readOnly
                                                                />
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridMonthlyGenerated">
                                                                <Form.Label>Total de energia gerada mensalmente (Kwh)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={values.month_02}
                                                                    name="monthly_generated"
                                                                    readOnly
                                                                />
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridYearlyGenerated">
                                                                <Form.Label>Total de energia gerada anualmente (Kwh)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={values.month_04}
                                                                    name="yearly_generated"
                                                                    readOnly
                                                                />
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={4} controlId="formGridCO2Reduction">
                                                                <Form.Label>Redução de emissão de gás CO² ao ano (Kg)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={values.month_02}
                                                                    name="co2_reduction"
                                                                    readOnly
                                                                />
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridSystemArea">
                                                                <Form.Label>Área ocupada pelo sistema (m²)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={values.month_02}
                                                                    name="system_area"
                                                                    readOnly
                                                                />
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridFinalSystemaCapacity">
                                                                <Form.Label>Capacidade do Sistema Arredondada (kwp)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={values.month_04}
                                                                    name="final_sistem_capacity"
                                                                    readOnly
                                                                />
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-2">
                                                            <Form.Group as={Col} sm={6} controlId="formGridRoofOrientation">
                                                                <Form.Label>Orientação do telhado</Form.Label>
                                                                <Form.Control
                                                                    as="select"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.roof_orientation}
                                                                    name="roof_orientation"
                                                                    isInvalid={!!errors.roof_orientation && touched.roof_orientation}
                                                                >
                                                                    <option hidden>Escolha uma opção</option>
                                                                    {
                                                                        roofOrientations.map((orientation, index) => {
                                                                            return <option key={index} value={orientation.id}>{orientation.name}</option>
                                                                        })
                                                                    }
                                                                </Form.Control>
                                                                <Form.Control.Feedback type="invalid">{touched.roof_orientation && errors.roof_orientation}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={6} controlId="formGridRoofType">
                                                                <Form.Label>Tipo de telhado</Form.Label>
                                                                <Form.Control
                                                                    as="select"
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.roof_type}
                                                                    name="roof_type"
                                                                    isInvalid={!!errors.roof_type && touched.roof_type}
                                                                >
                                                                    <option hidden>Escolha uma opção</option>
                                                                    {
                                                                        roofTypes.map((roofType, index) => {
                                                                            return <option key={index} value={roofType.id}>{roofType.name}</option>
                                                                        })
                                                                    }
                                                                </Form.Control>
                                                                <Form.Control.Feedback type="invalid">{touched.roof_type && errors.roof_type}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={4} controlId="formGridPreSystemPrice">
                                                                <Form.Label>Valor do sistema (parcial)</Form.Label>
                                                                <Form.Control
                                                                    type="text"
                                                                    value={values.month_04}
                                                                    name="pre_system_value"
                                                                    readOnly
                                                                />
                                                            </Form.Group>
                                                        </Row>

                                                        <Row className="mb-3">
                                                            <Col>
                                                                <Row>
                                                                    <Col>
                                                                        <h6 className="text-success">Valores <FaCashRegister /></h6>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>

                                                        <Form.Row className="mb-2">
                                                            <Form.Switch
                                                                id="show_discount"
                                                                label="Exibir descontos no orçamento?"
                                                                checked={values.show_discount}
                                                                onChange={() => { setFieldValue('show_discount', !values.show_discount) }}
                                                            />
                                                        </Form.Row>

                                                        <Row className="mb-3">
                                                            <Form.Group as={Col} sm={3} controlId="formGridDiscount">
                                                                <Form.Label>Desconto</Form.Label>
                                                                <InputGroup className="mb-2">
                                                                    <InputGroup.Prepend>
                                                                        <InputGroup.Text id="btnGroupDiscount">{values.percent ? '%' : 'R$'}</InputGroup.Text>
                                                                    </InputGroup.Prepend>
                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={(e) => {
                                                                            setFieldValue('discount', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                            setFieldValue('discount', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        value={values.discount}
                                                                        name="discount"
                                                                        isInvalid={!!errors.discount && touched.discount}
                                                                        aria-label="Valor"
                                                                        aria-describedby="btnGroupDiscount"
                                                                    />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{touched.discount && errors.discount}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Form.Group as={Col} sm={3} controlId="formGridDiscount">
                                                                <Form.Label>Acréscimo</Form.Label>
                                                                <InputGroup className="mb-2">
                                                                    <InputGroup.Prepend>
                                                                        <InputGroup.Text id="btnGroupDiscount">{values.percent ? '%' : 'R$'}</InputGroup.Text>
                                                                    </InputGroup.Prepend>
                                                                    <Form.Control
                                                                        type="text"
                                                                        onChange={(e) => {
                                                                            setFieldValue('increase', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                                                            setFieldValue('increase', prettifyCurrency(e.target.value));
                                                                        }}
                                                                        value={values.increase}
                                                                        name="increase"
                                                                        isInvalid={!!errors.increase && touched.increase}
                                                                        aria-label="Valor"
                                                                        aria-describedby="btnGroupDiscount"
                                                                    />
                                                                </InputGroup>
                                                                <Form.Control.Feedback type="invalid">{touched.increase && errors.increase}</Form.Control.Feedback>
                                                            </Form.Group>

                                                            <Col className="col-row">
                                                                <Form.Switch
                                                                    id="percent"
                                                                    label="Valores em Reais (R$)"
                                                                    checked={values.percent}
                                                                    onChange={() => { setFieldValue('percent', !values.percent) }}
                                                                />
                                                            </Col>
                                                        </Row>

                                                        <Form.Row className="mb-2">
                                                            <Form.Switch
                                                                id="show_values"
                                                                label="Exibir valores dos itens no orçamento?"
                                                                checked={values.show_values}
                                                                onChange={() => { setFieldValue('show_values', !values.show_values) }}
                                                            />
                                                        </Form.Row>

                                                        <Form.Row className="mb-3">
                                                            <Form.Group as={Col} controlId="formGridNotes">
                                                                <Form.Label>Observações</Form.Label>
                                                                <Form.Control
                                                                    as="textarea"
                                                                    rows={4}
                                                                    style={{ resize: 'none' }}
                                                                    onChange={handleChange}
                                                                    onBlur={handleBlur}
                                                                    value={values.notes}
                                                                    name="notes"
                                                                />
                                                            </Form.Group>
                                                        </Form.Row>

                                                        <Col className="border-top mb-3"></Col>

                                                        <Row className="justify-content-end">
                                                            {
                                                                messageShow ? <Col sm={3}><AlertMessage status={typeMessage} /></Col> :
                                                                    <Col sm={1}>
                                                                        <Button variant="success" type="submit">Salvar</Button>
                                                                    </Col>

                                                            }
                                                        </Row>
                                                    </Form>
                                                )}
                                            </Formik>
                                        </Container>
                                }
                            </> :
                                <PageWaiting status="warning" message="Acesso negado!" />
                        }
                    </>
            }
        </>
    )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { token } = context.req.cookies;

    const tokenVerified = await TokenVerify(token);

    if (tokenVerified === "not-authorized") { // Not authenticated, token invalid!
        return {
            redirect: {
                destination: `/?returnto=${context.req.url}`,
                permanent: false,
            },
        }
    }

    if (tokenVerified === "error") { // Server error!
        return {
            redirect: {
                destination: '/500',
                permanent: false,
            },
        }
    }

    return {
        props: {},
    }
}