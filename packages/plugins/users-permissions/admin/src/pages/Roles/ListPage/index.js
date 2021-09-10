import React, { useMemo, useState, useCallback } from 'react';
import {
  Button,
  HeaderLayout,
  IconButton,
  Layout,
  Main,
  Table,
  Tbody,
  Text,
  Tr,
  Td,
  Thead,
  Th,
  TableLabel,
  useNotifyAT,
  Box,
  Row,
  VisuallyHidden,
} from '@strapi/parts';

import { AddIcon, EditIcon, DeleteIcon } from '@strapi/icons';
import { useIntl } from 'react-intl';
import {
  useTracking,
  SettingsPageTitle,
  CheckPermissions,
  useNotification,
  CustomContentLayout,
  useRBAC,
  Search,
  useQueryParams,
  EmptyStateLayout,
  ConfirmDialog,
} from '@strapi/helper-plugin';
import { useHistory } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import matchSorter from 'match-sorter';

import { fetchData, deleteData } from './utils/api';
import { getTrad } from '../../../utils';
import pluginId from '../../../pluginId';
import permissions from '../../../permissions';

const RoleListPage = () => {
  const { trackUsage } = useTracking();
  const { formatMessage } = useIntl();
  const { push } = useHistory();
  const toggleNotification = useNotification();
  const { notifyStatus } = useNotifyAT();
  const [{ query }] = useQueryParams();
  const _q = query?._q || '';
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isConfirmButtonLoading, setIsConfirmButtonLoading] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState();

  const queryClient = useQueryClient();

  const updatePermissions = useMemo(() => {
    return {
      create: permissions.createRole,
      read: permissions.readRoles,
      update: permissions.updateRole,
      delete: permissions.deleteRole,
    };
  }, []);

  const {
    isLoading: isLoadingForPermissions,
    allowedActions: { canRead, canDelete },
  } = useRBAC(updatePermissions);

  const {
    isLoading: isLoadingForData,
    data: { roles },
    isFetching,
  } = useQuery('get-roles', () => fetchData(toggleNotification, notifyStatus), { initialData: {} });

  const isLoading = isLoadingForData || isFetching;

  const handleNewRoleClick = () => {
    trackUsage('willCreateRole');
    push(`/settings/${pluginId}/roles/new`);
  };

  const handleClickEdit = id => {
    push(`/settings/${pluginId}/roles/${id}`);
  };

  const handleShowConfirmDelete = () => {
    setShowConfirmDelete(!showConfirmDelete);
  };

  const emptyLayout = {
    roles: {
      id: getTrad('Roles.empty'),
      defaultMessage: "You don't have any roles yet.",
    },
    search: {
      id: getTrad('Roles.empty.search'),
      defaultMessage: 'No roles match the search.',
    },
  };

  const pageTitle = formatMessage({
    id: getTrad('HeaderNav.link.roles'),
    defaultMessage: 'Roles',
  });

  const deleteMutation = useMutation(id => deleteData(id), {
    onSuccess: async () => {
      await queryClient.invalidateQueries('get-roles');
    },
    onError: err => {
      if (err?.response?.data?.data) {
        toggleNotification({ type: 'warning', message: err.response.data.data });
      } else {
        toggleNotification({
          type: 'warning',
          message: { id: 'notification.error', defaultMessage: 'An error occured' },
        });
      }
    },
  });

  const checkCanDeleteRole = useCallback(
    role => {
      return canDelete && !['public', 'authenticated'].includes(role.type);
    },
    [canDelete]
  );

  const handleClickDelete = id => {
    setRoleToDelete(id);
    setShowConfirmDelete(!showConfirmDelete);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsConfirmButtonLoading(true);
      await deleteMutation.mutateAsync(roleToDelete);
      setShowConfirmDelete(!showConfirmDelete);
      setIsConfirmButtonLoading(false);
    } catch (error) {
      console.log(error);
    }
  };

  const sortedRoles = matchSorter(roles || [], _q, { keys: ['name', 'description'] });
  const emptyContent = _q && !sortedRoles.length ? 'search' : 'roles';

  const colCount = 4;
  const rowCount = (roles?.length || 0) + 1;

  return (
    <Layout>
      <SettingsPageTitle name={pageTitle} />
      <Main aria-busy={isLoading} labelledBy="roles">
        <HeaderLayout
          as="h1"
          id="roles"
          title={formatMessage({
            id: 'Settings.roles.title',
            defaultMessage: 'Roles',
          })}
          subtitle={formatMessage({
            id: 'Settings.roles.list.description',
            defaultMessage: 'List of roles',
          })}
          primaryAction={
            <CheckPermissions permissions={permissions.createRole}>
              <Button onClick={handleNewRoleClick} startIcon={<AddIcon />}>
                {formatMessage({
                  id: getTrad('List.button.roles'),
                  defaultMessage: 'Add new role',
                })}
              </Button>
            </CheckPermissions>
          }
        />
        <CustomContentLayout canRead={canRead} isLoading={isLoading || isLoadingForPermissions}>
          <Box paddingBottom={4}>
            <Row style={{ flexWrap: 'wrap' }}>
              <Search />
            </Row>
          </Box>
          {!roles?.length || !sortedRoles?.length ? (
            <EmptyStateLayout content={emptyLayout[emptyContent]} />
          ) : (
            <Table colCount={colCount} rowCount={rowCount}>
              <Thead>
                <Tr>
                  <Th>
                    <TableLabel>
                      {formatMessage({ id: getTrad('Roles.name'), defaultMessage: 'Name' })}
                    </TableLabel>
                  </Th>
                  <Th>
                    <TableLabel>
                      {formatMessage({
                        id: getTrad('Roles.description'),
                        defaultMessage: 'Description',
                      })}
                    </TableLabel>
                  </Th>
                  <Th>
                    <TableLabel>
                      {formatMessage({
                        id: getTrad('Roles.users'),
                        defaultMessage: 'Users',
                      })}
                    </TableLabel>
                  </Th>
                  <Th>
                    <VisuallyHidden>
                      {formatMessage({
                        id: 'components.TableHeader.actions-label',
                        defaultMessage: 'Actions',
                      })}
                    </VisuallyHidden>
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedRoles?.map(role => (
                  <Tr key={role.name}>
                    <Td width="20%">
                      <Text>{role.name}</Text>
                    </Td>
                    <Td width="50%">
                      <Text>{role.description}</Text>
                    </Td>
                    <Td width="30%">
                      <Text>
                        {`${role.nb_users} ${formatMessage({
                          id: getTrad('Roles.users'),
                          defaultMessage: 'users',
                        }).toLowerCase()}`}
                      </Text>
                    </Td>
                    <Td>
                      <Row>
                        <CheckPermissions permissions={permissions.updateRole}>
                          <IconButton
                            onClick={() => handleClickEdit(role.id)}
                            noBorder
                            icon={<EditIcon />}
                            label="Edit"
                          />
                        </CheckPermissions>
                        {checkCanDeleteRole(role) && (
                          <CheckPermissions permissions={permissions.deleteRole}>
                            <IconButton
                              onClick={() => handleClickDelete(role.id)}
                              noBorder
                              icon={<DeleteIcon />}
                              label="Delete"
                            />
                          </CheckPermissions>
                        )}
                      </Row>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CustomContentLayout>
        <ConfirmDialog
          isConfirmButtonLoading={isConfirmButtonLoading}
          onConfirm={handleConfirmDelete}
          onToggleDialog={handleShowConfirmDelete}
          isOpen={showConfirmDelete}
        />
      </Main>
    </Layout>
  );
};

export default RoleListPage;
