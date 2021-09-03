import React, { useState } from 'react';
import {
  CustomContentLayout,
  useRBAC,
  SettingsPageTitle,
  useNotification,
  useFocusWhenNavigate,
} from '@strapi/helper-plugin';
import { Button, Box, HeaderLayout, Main, Row } from '@strapi/parts';
import { Mail } from '@strapi/icons';
import { useLocation } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import get from 'lodash/get';
import adminPermissions from '../../../permissions';
import DynamicTable from './DynamicTable';
import Filters from './Filters';
import ModalForm from './ModalForm';
import Search from './Search';
import PaginationFooter from './PaginationFooter';
import { deleteData, fetchData } from './utils/api';
import displayedFilters from './utils/displayedFilters';
import tableHeaders from './utils/tableHeaders';

const ListPage = () => {
  const [isModalOpened, setIsModalOpen] = useState(false);
  const {
    allowedActions: { canCreate, canDelete, canRead },
  } = useRBAC(adminPermissions.settings.users);
  const queryClient = useQueryClient();
  const toggleNotification = useNotification();
  const { formatMessage } = useIntl();
  const { search } = useLocation();
  useFocusWhenNavigate();
  const queryName = ['users', search];

  const { status, data, isFetching } = useQuery(queryName, () => fetchData(search), {
    enabled: canRead,
    keepPreviousData: true,
    retry: false,
    staleTime: 1000 * 20,
    onError: () => {
      toggleNotification({
        type: 'warning',
        message: { id: 'notification.error', defaultMessage: 'An error occured' },
      });
    },
  });

  const handleToggle = () => {
    setIsModalOpen(prev => !prev);
  };

  const total = get(data, 'pagination.total', 0);

  const deleteAllMutation = useMutation(ids => deleteData(ids), {
    onSuccess: async () => {
      await queryClient.invalidateQueries(queryName);
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

  // This can be improved but we need to show an something to the user
  const isLoading =
    (status !== 'success' && status !== 'error') || (status === 'success' && isFetching);

  const createAction = canCreate ? (
    <Button data-testid="create-user-button" onClick={handleToggle} startIcon={<Mail />}>
      {formatMessage({
        id: 'Settings.permissions.users.create',
        defaultMessage: 'Create new user',
      })}
    </Button>
  ) : (
    undefined
  );

  return (
    <Main labelledBy="title">
      <SettingsPageTitle name="Users" />
      <HeaderLayout
        id="title"
        primaryAction={createAction}
        title={formatMessage({
          id: 'Settings.permissions.users.listview.header.title',
          defaultMessage: 'Users',
        })}
        subtitle={formatMessage(
          {
            id: 'Settings.permissions.users.listview.header.subtitle',
            defaultMessage: '{number, plural, =0 {# users} one {# user} other {# users}} found',
          },
          { number: total }
        )}
      />
      <CustomContentLayout canRead={canRead}>
        {status === 'error' && <div>TODO: An error occurred</div>}
        {canRead && (
          <>
            <Box paddingBottom={4}>
              <Row style={{ flexWrap: 'wrap' }}>
                <Search />
                <Filters displayedFilters={displayedFilters} />
              </Row>
            </Box>
          </>
        )}
        {canRead && (
          <>
            <DynamicTable
              canCreate={canCreate}
              canDelete={canDelete}
              isLoading={isLoading}
              onConfirmDeleteAll={deleteAllMutation.mutateAsync}
              headers={tableHeaders}
              rows={data?.results}
              withBulkActions
              withMainAction={canDelete}
            />
            <PaginationFooter pagination={data?.pagination} />
          </>
        )}
      </CustomContentLayout>
      {isModalOpened && <ModalForm onToggle={handleToggle} queryName={queryName} />}
    </Main>
  );
};

export default ListPage;