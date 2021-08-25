import { useState } from 'react';
import { useRouter } from 'next/router';
import { Row, Col, ListGroup, Button, Spinner } from 'react-bootstrap';
import { FaPencilAlt, FaBars, FaUserTag, FaPlay, FaPause } from 'react-icons/fa';

import api from '../../api/api';
import { PayType } from '../PayTypes';
import { Project } from '../Projects';
import { IncomeItem } from '../IncomeItems';
import { IncomeAttachment } from '../IncomeAttachments';
import IncomingsModal from './Modal';
import { prettifyCurrency } from '../InputMask/masks';

export interface Income {
    id: string;
    description: string;
    value: number;
    created_at: Date;
    project: Project | null;
    payType: PayType;
    items: IncomeItem[];
    attachments: IncomeAttachment[];
}

interface IncomingsProps {
    income: Income;
    handleListIncomings(): Promise<void>;
}

const Panels: React.FC<IncomingsProps> = ({ income, handleListIncomings }) => {
    const router = useRouter();

    const [showModalEdit, setShowModalEdit] = useState(false);

    const handleShowModalEdit = () => setShowModalEdit(true);

    function handleRoute(route: string) {
        router.push(route);
    }

    async function handleIncome() {
        await handleListIncomings();
    }

    return (
        <>
            <ListGroup.Item variant="light">
                <Row className="align-items-center">
                    <Col sm={1}>
                        <FaBars />
                    </Col>

                    <Col><span>{income.description}</span></Col>

                    <Col><span>{`R$ ${prettifyCurrency(String(income.value))}`}</span></Col>

                    <Col className="col-row text-end">
                        <Button
                            variant="outline-success"
                            className="button-link"
                            onClick={handleShowModalEdit}
                            title="Editar receita"
                        >
                            <FaPencilAlt /> Editar
                        </Button>
                    </Col>
                </Row>
            </ListGroup.Item>

            <IncomingsModal incomeId={income.id} show={showModalEdit} handleIncome={handleIncome} />
        </>
    )
}

export default Panels;