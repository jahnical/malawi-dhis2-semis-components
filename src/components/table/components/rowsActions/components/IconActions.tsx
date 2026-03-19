import React from 'react';
import style from '../tableRowActions.module.css'
import { RowActionsProps, RowActionsType } from '../../../../../types/table/TableRowActionsProps';
import { IconButton, Tooltip } from '@mui/material';

export default function IconActions(props: RowActionsProps) {
  const { actions, disabled, row } = props;

  const isActionDisabled = (option: RowActionsType) => {
    const isOptionDisabled = typeof option.disabled === 'function'
      ? option.disabled(row)
      : option.disabled;

    return isOptionDisabled || (disabled && Boolean(option.disableOnInactive));
  }

  return (
    <React.Fragment>
      {
        actions?.map((option: RowActionsType, i: number) => (
          <Tooltip
            key={i}
            title={option.label}
            disableHoverListener={isActionDisabled(option)}
          >
            <div
              style={{ cursor: isActionDisabled(option) ? 'not-allowed' : "pointer" }}
            >
              <IconButton
                onClick={(event) => {
                  option.onClick({ row });
                }}
                className={style.rowActionsIcon}
                disabled={isActionDisabled(option)}
                style={{ color: option.color, opacity: isActionDisabled(option) ? "0.5" : "1" }}
              >
                {option.icon}
              </IconButton>
            </div>
          </Tooltip>
        ))
      }
    </React.Fragment>
  );
}
