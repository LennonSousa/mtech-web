import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button, ButtonGroup, Row, Col } from 'react-bootstrap';
import { FaPencilAlt } from 'react-icons/fa';
import { format } from 'date-fns';

import { Project } from '../Projects';

import styles from './styles.module.css';

interface ProjectListItemProps {
    project: Project;
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({ project }) => {
    const router = useRouter();

    function goToEdit() {
        router.push(`/projects/edit/${project.id}`);
    }

    return (
        <Col sm={4}>
            <div className={styles.itemContainer}>
                <Row className="align-items-center">
                    <Col sm={10}>
                        <Link href={`/projects/details/${project.id}`}>
                            <a>
                                <h5 className={styles.itemText}>{project.customer}</h5>
                            </a>
                        </Link>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <span className={`form-control-plaintext text-secondary ${styles.itemText}`} >
                            {project.status.name}
                        </span>
                    </Col>
                </Row>

                <Row>
                    <Col>
                        <span>
                            {format(new Date(project.updated_at), 'dd/MM/yyyy')}
                        </span>
                    </Col>
                </Row>

                <Row>
                    <ButtonGroup size="sm" className="col-12">
                        <Button
                            variant="success"
                            title="Editar projeto."
                            onClick={goToEdit}
                        >
                            <FaPencilAlt /> Editar
                        </Button>
                    </ButtonGroup>
                </Row>
            </div>
        </Col >
    )
}

export default ProjectListItem;