import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Accordion, Card, Dropdown, Nav, NavDropdown, Row, Col } from 'react-bootstrap';
import {
    FaColumns,
    FaUserTie,
    FaFileAlt,
    FaList,
    FaPlus,
    FaIdCard,
    FaMapSigns,
    FaFileSignature,
    FaFileContract,
    FaProjectDiagram,
    FaClipboardList,
    FaLayerGroup,
    FaUniversity,
    FaCity,
    FaAward,
    FaBalanceScaleLeft,
    FaFileExcel,
    FaSortAlphaDown,
    FaUsers,
    FaUsersCog
} from 'react-icons/fa';

import { SideBarContext } from '../../contexts/SideBarContext';
import { AuthContext } from '../../contexts/AuthContext';
import { can } from '../../components/Users';

import styles from './styles.module.css';

const Sidebar: React.FC = () => {
    const router = useRouter();
    const { itemSideBar, selectedMenu, handleItemSideBar } = useContext(SideBarContext);
    const { signed, user } = useContext(AuthContext);

    const [showPageHeader, setShowPageHeader] = useState(false);

    const pathsNotShow = ['/', '/users/new/auth', '/users/reset', '/users/reset/auth', '/404', '500'];

    useEffect(() => {
        let show = false;

        if (signed && user) {
            if (!pathsNotShow.find(item => { return item === router.route })) show = true;
        }

        setShowPageHeader(show);
    }, [signed, router.route, user]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleToDashboard() {
        router.push('/dashboard');
    }

    return (
        showPageHeader && user ? <div className={styles.sideBarContainer}>
            <Accordion activeKey={itemSideBar} className={styles.accordionContainer}>
                <Card className={styles.menuCard}>
                    <Accordion.Toggle
                        as={Card.Header}
                        className={styles.menuCardHeader}
                        eventKey="dashboard"
                        onClick={handleToDashboard}
                    >
                        <div>
                            <FaColumns /> <span>Painel</span>
                        </div>
                    </Accordion.Toggle>
                </Card>

                {
                    can(user, "estimates", "read:any") && <Card className={styles.menuCard}>
                        <Accordion.Toggle
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="estimates"
                            onClick={() => handleItemSideBar('estimates')}
                        >
                            <div>
                                <FaUserTie /> <span>Orçamento</span>
                            </div>
                        </Accordion.Toggle>

                        <Accordion.Collapse eventKey="estimates">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/estimates">
                                    <a title="Listar todos os orçamentos" data-title="Listar todos os orçamentos">
                                        <Row
                                            className={
                                                selectedMenu === 'estimates-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Lista</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "estimates", "create") && <Link href="/estimates/new">
                                        <a title="Criar um novo orçamento" data-title="Criar um novo orçamento">
                                            <Row
                                                className={
                                                    selectedMenu === 'estimates-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Novo</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }

                                {
                                    can(user, "estimates", "update:any") && <>
                                        <Dropdown.Divider />
                                        <Link href="/estimates/panels">
                                            <a title="Listar os painéis." data-title="Listar os painéis.">
                                                <Row
                                                    className={
                                                        selectedMenu === 'estimates-panels' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaUsersCog size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Painéis</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>

                                        <Dropdown.Divider />

                                        <Link href="/estimates/status">
                                            <a title="Listar as fases." data-title="Listar as fases.">
                                                <Row
                                                    className={
                                                        selectedMenu === 'estimates-status' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaUsersCog size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Fases</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>

                                        <Link href="/estimates/roofs/orientations">
                                            <a title="Listar orientaçõs de telhado." data-title="Listar orientaçõs de telhado.">
                                                <Row
                                                    className={
                                                        selectedMenu === 'estimates-roofs-orientations' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaUsersCog size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Orientações</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>

                                        <Link href="/estimates/roofs/types">
                                            <a title="Listar tipos de telhados." data-title="Listar tipos de telhados.">
                                                <Row
                                                    className={
                                                        selectedMenu === 'estimates-roofs-types' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaUsersCog size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Tipos</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>
                                    </>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    can(user, "projects", "read:any") && <Card className={styles.menuCard}>
                        <Accordion.Toggle
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="projects"
                            onClick={() => handleItemSideBar('projects')}
                        >
                            <div>
                                <FaFileAlt /> <span>Projetos</span>
                            </div>
                        </Accordion.Toggle>

                        <Accordion.Collapse eventKey="projects">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/projects">
                                    <a title="Listar todos os imóveis" data-title="Listar todos os imóveis">
                                        <Row
                                            className={
                                                selectedMenu === 'projects-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Lista</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "projects", "create") && <Link href="/projects/new">
                                        <a title="Criar um novo projeto" data-title="Criar um novo projeto">
                                            <Row
                                                className={
                                                    selectedMenu === 'projects-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Novo</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }

                                {
                                    can(user, "projects", "update:any") && <>
                                        <Link href="/docs/project">
                                            <a title="Listar os documentos para projetos" data-title="Listar os documentos para projetos">
                                                <Row
                                                    className={
                                                        selectedMenu === 'projects-docs' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaIdCard size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Documentos</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>
                                        <Dropdown.Divider />

                                        <Link href="/projects/types">
                                            <a title="Listar os tipos" data-title="Listar os tipos">
                                                <Row
                                                    className={
                                                        selectedMenu === 'projects-types' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaProjectDiagram size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Tipos</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>

                                        <Link href="/projects/status">
                                            <a title="Listar as fases" data-title="Listar as fases">
                                                <Row
                                                    className={
                                                        selectedMenu === 'projects-status' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaClipboardList size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Fases</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>

                                        <Link href="/projects/lines">
                                            <a title="Listar as linhas de crédito" data-title="Listar as linhas de crédito">
                                                <Row
                                                    className={
                                                        selectedMenu === 'projects-lines' ? styles.selectedMenuCardBodyItem :
                                                            styles.menuCardBodyItem
                                                    }
                                                >
                                                    <Col sm={1}>
                                                        <FaLayerGroup size={14} />
                                                    </Col>
                                                    <Col>
                                                        <span>Linhas</span>
                                                    </Col>
                                                </Row>
                                            </a>
                                        </Link>
                                    </>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }

                {
                    can(user, "users", "read:any") && <Card className={styles.menuCard}>
                        <Accordion.Toggle
                            as={Card.Header}
                            className={styles.menuCardHeader}
                            eventKey="users"
                            onClick={() => handleItemSideBar('users')}
                        >
                            <div>
                                <FaUsers /> <span>Usuários</span>
                            </div>
                        </Accordion.Toggle>
                        <Accordion.Collapse eventKey="users">
                            <Card.Body className={styles.menuCardBody}>
                                <Link href="/users">
                                    <a title="Listar todos os usuários" data-title="Listar todos os usuários">
                                        <Row
                                            className={
                                                selectedMenu === 'users-index' ? styles.selectedMenuCardBodyItem :
                                                    styles.menuCardBodyItem
                                            }
                                        >
                                            <Col sm={1}>
                                                <FaList size={14} />
                                            </Col>
                                            <Col>
                                                <span>Lista</span>
                                            </Col>
                                        </Row>
                                    </a>
                                </Link>

                                {
                                    can(user, "users", "create") && <Link href="/users/new">
                                        <a title="Criar um novo usuário" data-title="Criar um novo usuário">
                                            <Row
                                                className={
                                                    selectedMenu === 'users-new' ? styles.selectedMenuCardBodyItem :
                                                        styles.menuCardBodyItem
                                                }
                                            >
                                                <Col sm={1}>
                                                    <FaPlus size={14} />
                                                </Col>
                                                <Col>
                                                    <span>Novo</span>
                                                </Col>
                                            </Row>
                                        </a>
                                    </Link>
                                }
                            </Card.Body>
                        </Accordion.Collapse>
                    </Card>
                }
            </Accordion>
        </div > : null
    )
}

export function SideNavBar() {
    const { user } = useContext(AuthContext);

    return (
        user ? <Nav className="me-auto mb-3">
            <Link href="/dashboard" passHref>
                <Nav.Link><FaColumns /> <span>Painel</span></Nav.Link>
            </Link>

            {
                can(user, "estimates", "read:any") && <NavDropdown title="Clientes" id="estimates-dropdown">
                    <Link href="/estimates" passHref>
                        <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "estimates", "create") && <Link href="/estimates/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }

                    {
                        can(user, "estimates", "update:any") && <>
                            <NavDropdown.Divider />

                            <Link href="/docs/customer" passHref>
                                <NavDropdown.Item ><FaIdCard size={14} /> Documentos</NavDropdown.Item>
                            </Link>

                            <Link href="/estimates/types" passHref>
                                <NavDropdown.Item ><FaUsersCog size={14} /> Tipos</NavDropdown.Item>
                            </Link>
                        </>
                    }
                </NavDropdown>
            }

            {
                can(user, "projects", "read:any") && <NavDropdown title="Projetos" id="projects-dropdown">
                    <Link href="/projects" passHref>
                        <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                    </Link>

                    {
                        can(user, "projects", "create") && <Link href="/projects/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }

                    {
                        can(user, "projects", "update:any") && <>
                            <Link href="/docs/project" passHref>
                                <NavDropdown.Item ><FaIdCard size={14} /> Documentos</NavDropdown.Item>
                            </Link>

                            <NavDropdown.Divider />

                            <Link href="/projects/types" passHref>
                                <NavDropdown.Item ><FaProjectDiagram size={14} /> Tipos</NavDropdown.Item>
                            </Link>

                            <Link href="/projects/status" passHref>
                                <NavDropdown.Item ><FaClipboardList size={14} /> Fases</NavDropdown.Item>
                            </Link>

                            <Link href="/projects/lines" passHref>
                                <NavDropdown.Item ><FaLayerGroup size={14} /> Linhas</NavDropdown.Item>
                            </Link>
                        </>
                    }
                </NavDropdown>
            }

            {
                can(user, "users", "read:any") && <NavDropdown title="Usuários" id="users-dropdown">
                    {
                        can(user, "users", "create") && <Link href="/users" passHref>
                            <NavDropdown.Item ><FaList size={14} /> Lista</NavDropdown.Item>
                        </Link>
                    }

                    <NavDropdown.Divider />

                    {
                        can(user, "users", "read:any") && <Link href="/users/new" passHref>
                            <NavDropdown.Item ><FaPlus size={14} /> Novo</NavDropdown.Item>
                        </Link>
                    }
                </NavDropdown>
            }
        </Nav> : <></>
    )
}

export default Sidebar;