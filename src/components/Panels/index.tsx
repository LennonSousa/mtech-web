import { useState } from 'react';
import { useRouter } from 'next/router';
import { Row, Col, ListGroup, Button, Spinner } from 'react-bootstrap';
import { FaPencilAlt, FaBars, FaUserTag, FaPlay, FaPause } from 'react-icons/fa';

import api from '../../api/api';
import { PanelPrice } from '../PanelPrices';
import { Estimate } from '../Estimates';
import { prettifyCurrency } from '../InputMask/masks';


export interface Panel {
    id: string;
    name: string;
    capacity: number;
    paused: boolean;
    order: number;
    prices: PanelPrice[];
    estimates: Estimate[];
}

interface PanelsProps {
    panel: Panel;
    handleListPanels(): Promise<void>;
}

const Panels: React.FC<PanelsProps> = ({ panel, handleListPanels }) => {
    const router = useRouter();

    const [itemPausing, setItemPausing] = useState(false);

    const togglePauseItem = async () => {
        setItemPausing(true);

        try {
            await api.put(`panels/${panel.id}`, {
                name: panel.name,
                paused: !panel.paused,
                order: panel.order,
            });

            await handleListPanels();
        }
        catch (err) {
            console.log("Error to pause panel");
            console.log(err);
        }

        setItemPausing(false);
    }

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <ListGroup.Item variant={!panel.paused ? "light" : "danger"}>
            <Row className="align-items-center">
                <Col sm={1}>
                    <FaBars />
                </Col>

                <Col><span>{panel.name}</span></Col>

                <Col><span>{`${prettifyCurrency(String(panel.capacity))} Wp`}</span></Col>

                <Col className="col-row text-end">
                    <Button
                        variant="outline-success"
                        className="button-link"
                        onClick={togglePauseItem}
                        title="Pausar painel"
                    >
                        {
                            itemPausing ? <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                            /> : panel.paused ? (<><FaPlay /> Pausado</>) : (<><FaPause /> Pausar</>)
                        }
                    </Button>
                </Col>

                <Col className="col-row text-end">
                    <Button
                        variant="outline-success"
                        className="button-link"
                        onClick={() => handleRoute(`/estimates/panels/details/${panel.id}`)}
                        title="Ver informações sobre o painel"
                    >
                        <FaUserTag /> Detalhes
                    </Button>
                </Col>

                <Col className="col-row text-end">
                    <Button
                        variant="outline-success"
                        className="button-link"
                        onClick={() => handleRoute(`/estimates/panels/edit/${panel.id}`)}
                        title="Editar painel"
                    >
                        <FaPencilAlt /> Editar
                    </Button>
                </Col>
            </Row>
        </ListGroup.Item>
    )
}

export default Panels;