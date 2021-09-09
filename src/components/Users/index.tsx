import { useState } from 'react';
import { useRouter } from 'next/router';
import { Row, Col, ListGroup, Button, Spinner } from 'react-bootstrap';
import { FaUserEdit, FaPause, FaPlay, FaUserClock, FaUserTag } from 'react-icons/fa';

import api from '../../api/api';

export type Role = 'employees' | 'shifts' | 'attendances' | 'estimates' | 'projects' | 'services' | 'store' | 'finances' | 'users';
export type Grant = 'view' | 'view_self' | 'create' | 'update' | 'update_self' | 'remove';

export interface UserRole {
    id: string;
    role: Role;
    view: boolean;
    view_self: boolean;
    create: boolean;
    update: boolean;
    update_self: boolean;
    remove: boolean;
}

export interface User {
    id: string,
    name: string;
    phone: string;
    email: string;
    password: string;
    active: boolean;
    paused: boolean;
    root: boolean;
    created_at: Date;
    roles: UserRole[];
}

interface TranslateItem {
    item: string,
    translated: string;
}

export const translatedRoles: TranslateItem[] = [
    {
        item: 'employees',
        translated: 'Funcionários',
    },
    {
        item: 'shifts',
        translated: 'Turnos',
    },
    {
        item: 'attendances',
        translated: 'Ponto',
    },
    {
        item: 'estimates',
        translated: 'Orçamentos',
    },
    {
        item: 'projects',
        translated: 'Projetos',
    },
    {
        item: 'services',
        translated: 'Ordens de Serviço',
    },
    {
        item: 'store',
        translated: 'Loja'
    },
    {
        item: 'finances',
        translated: 'Financeiro'
    },
    {
        item: 'users',
        translated: 'Usuários',
    },
];

interface UsersProps {
    user: User;
    userAuthenticated: User;
    handleListUsers(): Promise<void>;
}

export function can(user: User, userRole: Role, userGrant: Grant) {
    const foundRole = user.roles.find(role => {
        return role.role === userRole && role[userGrant] === true
    });

    if (foundRole) return true;

    return false;
}

export function translateRole(resource: Role) {
    const translatedRole = translatedRoles.find(role => { return role.item === resource });

    if (translatedRole) return translatedRole.translated;

    return resource;
}

const Users: React.FC<UsersProps> = ({ user, userAuthenticated, handleListUsers }) => {
    const router = useRouter();

    const [userPausing, setCategoryPausing] = useState(false);

    const togglePauseUser = async () => {
        setCategoryPausing(true);

        try {
            if (userAuthenticated.id !== user.id && !user.root) {
                await api.put(`users/${user.id}`, {
                    name: user.name,
                    phone: user.phone,
                    paused: !user.paused,
                });

                await handleListUsers();
            }
        }
        catch (err) {
            console.log("Error to pause user");
            console.log(err);
        }

        setCategoryPausing(false);
    }

    function handleRoute(route: string) {
        router.push(route);
    }

    return (
        <ListGroup.Item variant={!user.active ? "secondary" : !user.paused ? "light" : "danger"}>
            <Row className="align-items-center">
                <Col><span>{user.name}</span></Col>

                {
                    !user.active && <Col className="col-row text-end">
                        <FaUserClock /> aguardando aceitação...
                    </Col>
                }

                {
                    userAuthenticated.id !== user.id
                    && can(userAuthenticated, "users", "update")
                    && !user.root
                    && <Col className="col-row text-end">
                        <Button
                            variant="outline-success"
                            className="button-link"
                            onClick={togglePauseUser}
                            title="Pausar usuário"
                        >
                            {
                                userPausing ? <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                /> : user.paused ? (<><FaPlay /> Pausado</>) : (<><FaPause /> Pausar</>)
                            }
                        </Button>
                    </Col>
                }

                <Col className="col-row text-end">
                    <Button
                        variant="outline-success"
                        className="button-link"
                        onClick={() => handleRoute(`/users/details/${user.id}`)}
                        title="Ver informações sobre o usuário"
                    >
                        <FaUserTag /> Detalhes
                    </Button>
                </Col>

                {
                    can(userAuthenticated, "users", "update")
                        || userAuthenticated.id === user.id
                        && can(userAuthenticated, "users", "update_self")
                        ? <Col className="col-row text-end">
                            <Button
                                variant="outline-success"
                                className="button-link"
                                onClick={() => handleRoute(`/users/edit/${user.id}`)}
                                title="Editar usuário"
                            >
                                <FaUserEdit /> Editar
                            </Button>
                        </Col> : <></>
                }
            </Row>
        </ListGroup.Item>
    )
}

export default Users;