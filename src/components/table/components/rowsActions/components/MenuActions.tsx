import React from 'react';
import { Center as CenteredContent } from '@dhis2/ui'
import { RowActionsProps } from '../../../../../types/table/TableRowActionsProps';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { MoreVert } from '@mui/icons-material';


export default function MenuActions(props: RowActionsProps) {
  const { actions: menuItems, disabled, row } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const isActionDisabled = (item: any) => {
    const isOptionDisabled = typeof item.disabled === 'function'
      ? item.disabled(row)
      : item.disabled;

    return isOptionDisabled || (disabled && Boolean(item.disableOnInactive));
  }

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <React.Fragment>
      <CenteredContent>
        <IconButton
          id="basic-button"
          aria-haspopup="true"
          disabled={disabled}
          onClick={handleClick}
          aria-expanded={open ? 'true' : undefined}
          aria-controls={open ? 'basic-menu' : undefined}
          style={{ color: "#212121", opacity: disabled ? "0.5" : "1" }}
        >
          <MoreVert />
        </IconButton>
      </CenteredContent>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {menuItems?.map((item: any, index: any) => (
          <MenuItem dense
            key={index}
            onClick={(event) => {
              item.onClick({ row });
              handleClose();
            }}
            disabled={isActionDisabled(item)}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </React.Fragment>
  );
}
