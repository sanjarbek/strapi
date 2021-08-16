import { Box, Row, Td, Text, Tr, IconButton, BaseCheckbox } from '@strapi/parts';
import PropTypes from 'prop-types';
import React from 'react';
import { useIntl } from 'react-intl';
import RoleDescription from './RoleDescription';

const RoleRow = ({ onToggle, id, name, description, usersCount, isChecked, icons }) => {
  const { formatMessage } = useIntl();

  const usersCountText = formatMessage(
    { id: `Roles.RoleRow.user-count.${usersCount > 1 ? 'plural' : 'singular'}` },
    { number: usersCount }
  );

  return (
    <Tr>
      {Boolean(onToggle) && (
        <Td>
          <BaseCheckbox
            name="role-checkbox"
            onValueChange={() => onToggle(id)}
            value={isChecked}
            aria-label={formatMessage({ id: `Roles.RoleRow.select-all` }, { name })}
          />
        </Td>
      )}
      <Td>
        <Text textColor="neutral800">{name}</Text>
      </Td>
      <Td>
        <RoleDescription textColor="neutral800">{description}</RoleDescription>
      </Td>
      <Td>
        <Text textColor="neutral800">{usersCountText}</Text>
      </Td>
      <Td>
        <Row>
          {icons.map((icon, i) =>
            icon ? (
              <Box key={icon.label} paddingLeft={i === 0 ? 0 : 1}>
                <IconButton onClick={icon.onClick} label={icon.label} noBorder icon={icon.icon} />
              </Box>
            ) : null
          )}
        </Row>
      </Td>
    </Tr>
  );
};

RoleRow.defaultProps = {
  onToggle: undefined,
  isChecked: undefined,
};

RoleRow.propTypes = {
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  usersCount: PropTypes.number.isRequired,
  icons: PropTypes.array.isRequired,
  onToggle: PropTypes.func,
  isChecked: PropTypes.bool,
};

export default RoleRow;