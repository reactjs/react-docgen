import React from 'react';
import PropTypes from 'prop-types';
import MatMenuItem, {
    MenuItemProps as MatMenuItemProps,
} from '@mui/material/MenuItem';

export type ComponentObjectOf<
    T extends React.ElementType,
    P = React.ComponentProps<T>
> = React.FunctionComponent<P>;

export type MenuItemProps<
    D extends React.ElementType,
    P = {}
> = MatMenuItemProps<D, P>;

const MenuItem = React.forwardRef<MenuItemProps<'li'>>(
    <C extends React.ElementType>(
        props: MenuItemProps<C, { component?: C }>,
        ref: React.Ref<any>
    ) => {
        return <MatMenuItem {...props} ref={ref} />;
    }
) as unknown as <C extends React.ElementType = 'li'>(
    props: MenuItemProps<C, { component?: C }>
) => React.ReactElement;

(MenuItem as ComponentObjectOf<typeof MenuItem>).propTypes = {
    /** Menu item contents. */
    children: PropTypes.node,
    /** Override or extend the styles applied to the component. See CSS API below for more details. */
    classes: PropTypes.object,
};

(MenuItem as ComponentObjectOf<typeof MenuItem>).defaultProps = {
    component: 'li',
    disableGutters: false,
};

export default MenuItem;
